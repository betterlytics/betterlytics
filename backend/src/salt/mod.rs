//! Secret, daily-rotated salt used to anonymize visitor fingerprints.
//!
//! - 16 random bytes per UTC day, persisted in Postgres.
//! - `current` + `previous` are held in memory so a session spanning a rotation still matches.
//! - Rotation is lazy and non-blocking: the first event of a new UTC day kicks off a
//!   background `INSERT ... ON CONFLICT` (safe under concurrent / multi-instance races) that
//!   creates the new salt and prunes salts older than yesterday. Events use the cached salt
//!   meanwhile, so they never block on Postgres; a pruned salt's fingerprints are irreversible.

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};

use anyhow::{Context, Result, anyhow};
use arc_swap::ArcSwap;
use chrono::{NaiveDate, Utc};
use once_cell::sync::OnceCell;
use rand::RngCore;
use tracing::{error, info};

use crate::postgres::PostgresPool;

/// Secret salt material mixed into every visitor fingerprint.
pub type Salt = [u8; 16];

#[derive(Clone)]
struct SaltState {
    /// UTC date the `current` salt belongs to.
    date: NaiveDate,
    current: Salt,
    /// Previous day's salt, used to keep sessions alive across a midnight rotation.
    previous: Option<Salt>,
}

static POOL: OnceCell<Arc<PostgresPool>> = OnceCell::new();
static STATE: OnceCell<ArcSwap<SaltState>> = OnceCell::new();
/// Ensures only one background rotation runs at a time.
static ROTATION_IN_FLIGHT: AtomicBool = AtomicBool::new(false);
/// Unix-seconds of the last rotation attempt; rate-limits retries while the DB is unreachable.
static LAST_ROTATION_ATTEMPT: AtomicI64 = AtomicI64::new(0);
/// Minimum gap between rotation attempts when one keeps failing.
const ROTATION_RETRY_COOLDOWN_SECS: i64 = 30;

/// Load (or create) salts from Postgres and initialise the in-memory cache.
/// Must be called once at startup, after the Postgres pool is ready.
pub async fn init(pool: Arc<PostgresPool>) -> Result<()> {
    POOL.set(pool)
        .map_err(|_| anyhow!("salt::init called more than once"))?;

    let today = Utc::now().date_naive();
    let state = ensure_state(today)
        .await
        .context("failed to load initial salts from Postgres")?;

    STATE
        .set(ArcSwap::from_pointee(state))
        .map_err(|_| anyhow!("salt state already initialised"))?;

    info!("Salt service initialised for UTC date {}", today);
    Ok(())
}

/// Return today's `current` salt and the `previous` salt.
///
/// Lock-free read on the hot path. When the UTC day has rolled over, the cached salts (still
/// a valid secret, just yesterday's) are returned immediately and the rotation is kicked off
/// in the background, so an event never blocks on Postgres.
pub async fn current_and_previous() -> (Salt, Option<Salt>) {
    let state = STATE
        .get()
        .expect("salt::init must be called before current_and_previous");

    let cached = state.load();
    let today = Utc::now().date_naive();

    if cached.date == today {
        return (cached.current, cached.previous);
    }

    spawn_rotation_if_due(today);
    (cached.current, cached.previous)
}

/// Clears `ROTATION_IN_FLIGHT` on drop, so the flag is reset even if the rotation task
/// panics, otherwise a panic would leave it stuck `true` and disable rotation permanently.
struct RotationGuard;

impl Drop for RotationGuard {
    fn drop(&mut self) {
        ROTATION_IN_FLIGHT.store(false, Ordering::Release);
    }
}

/// Kick off a background rotation for `today` unless one is already running or was just
/// attempted. Never blocks the caller; `STATE` is updated when the rotation succeeds.
fn spawn_rotation_if_due(today: NaiveDate) {
    let now = Utc::now().timestamp();
    if now - LAST_ROTATION_ATTEMPT.load(Ordering::Relaxed) < ROTATION_RETRY_COOLDOWN_SECS {
        return;
    }
    if ROTATION_IN_FLIGHT
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return;
    }
    LAST_ROTATION_ATTEMPT.store(now, Ordering::Relaxed);

    tokio::spawn(async move {
        let _guard = RotationGuard;
        match ensure_state(today).await {
            Ok(new_state) => {
                if let Some(state) = STATE.get() {
                    state.store(Arc::new(new_state));
                }
            }
            Err(e) => error!("Salt rotation failed, still serving previous salt: {e:#}"),
        }
    });
}

/// Ensure a salt row exists for `today`, prune stale salts, and return the
/// `{ current = today, previous = yesterday }` state read back from the database.
async fn ensure_state(today: NaiveDate) -> Result<SaltState> {
    let pool = POOL.get().context("salt pool not initialised")?;
    let conn = pool.connection().await?;

    let mut fresh = [0u8; 16];

    rand::rngs::OsRng
        .try_fill_bytes(&mut fresh)
        .map_err(|e| anyhow!("failed to generate salt bytes: {e}"))?;

    let fresh_bytes: &[u8] = &fresh;

    conn.execute(
        r#"INSERT INTO "AnalyticsSalt" ("saltDate", "salt") VALUES ($1, $2) ON CONFLICT ("saltDate") DO NOTHING"#,
        &[&today, &fresh_bytes],
    )
    .await?;

    // Keep only today + yesterday; anything older is deleted so old fingerprints become irreversible.
    let cutoff = today.pred_opt().unwrap_or(today);
    conn.execute(
        r#"DELETE FROM "AnalyticsSalt" WHERE "saltDate" < $1"#,
        &[&cutoff],
    )
    .await?;

    let rows = conn
        .query(
            r#"SELECT "saltDate", "salt" FROM "AnalyticsSalt" ORDER BY "saltDate" DESC LIMIT 2"#,
            &[],
        )
        .await?;

    let mut iter = rows.iter();
    
    let current_row = iter.next().context("no salt row present after ensure")?;
    let current = to_salt(current_row.try_get::<_, &[u8]>(1)?)?;

    let previous = match iter.next() {
        Some(row) => Some(to_salt(row.try_get::<_, &[u8]>(1)?)?),
        None => None,
    };

    Ok(SaltState {
        date: today,
        current,
        previous,
    })
}

fn to_salt(bytes: &[u8]) -> Result<Salt> {
    bytes
        .try_into()
        .map_err(|_| anyhow!("salt column is not 16 bytes (got {})", bytes.len()))
}
