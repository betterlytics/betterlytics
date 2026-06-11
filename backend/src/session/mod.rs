use anyhow::Result;
use chrono::{DateTime, Utc};
use moka::sync::Cache;
use std::time::Duration;
use once_cell::sync::Lazy;
use rand::Rng;

const SESSION_EXPIRY: Duration = Duration::from_secs(30 * 60);

#[derive(Clone)]
struct SessionEntry {
    session_id: u64,
    created_at: DateTime<Utc>,
}

static SESSION_CACHE: Lazy<Cache<String, SessionEntry>> = Lazy::new(|| {
    Cache::builder()
        .time_to_idle(SESSION_EXPIRY)
        .build()
});

fn generate_session_id() -> u64 {
    rand::thread_rng().r#gen()
}

pub fn get_or_create_session_id(
    site_id: &str,
    visitor_fingerprint: u64,
    previous_fingerprint: impl FnOnce() -> Option<u64>,
    event_timestamp: DateTime<Utc>,
) -> Result<(u64, DateTime<Utc>)> {
    let cache_key = format!("{}-{}", site_id, visitor_fingerprint);

    if let Some(entry) = SESSION_CACHE.get(&cache_key) {
        return Ok((entry.session_id, entry.created_at));
    }

    // A visitor crossing midnight has a different fingerprint under the previous salt; fall
    // back to it to keep the session alive.
    if let Some(prev_fp) = previous_fingerprint() {
        if prev_fp != visitor_fingerprint {
            let previous_key = format!("{}-{}", site_id, prev_fp);
            if let Some(entry) = SESSION_CACHE.get(&previous_key) {
                return Ok((entry.session_id, entry.created_at));
            }
        }
    }

    let new_session_id = generate_session_id();
    let created_at = event_timestamp;

    SESSION_CACHE.insert(cache_key, SessionEntry {
        session_id: new_session_id,
        created_at,
    });

    Ok((new_session_id, created_at))
}
