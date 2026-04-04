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
    last_pageview: Option<(String, DateTime<Utc>)>,
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
) -> Result<(u64, DateTime<Utc>)> {
    let cache_key = format!("{}-{}", site_id, visitor_fingerprint);

    if let Some(entry) = SESSION_CACHE.get(&cache_key) {
        return Ok((entry.session_id, entry.created_at));
    }

    let new_session_id = generate_session_id();
    let created_at = Utc::now();

    SESSION_CACHE.insert(cache_key, SessionEntry {
        session_id: new_session_id,
        created_at,
        last_pageview: None,
    });

    Ok((new_session_id, created_at))
}

/// Returns the previous pageview `(prev_url, duration_secs)` and updates the cache.
///
/// - For `pageview`: reads previous pageview from cache, then sets last_pageview to current url/timestamp.
/// - For `pagehide`: reads previous pageview from cache, then clears last_pageview so the next
///   pageview (on a new page load) starts fresh with no inherited duration.
pub fn get_and_update_pageview_state(
    site_id: &str,
    visitor_fingerprint: u64,
    event_type: &str,
    url: &str,
    timestamp: DateTime<Utc>,
) -> Option<(String, u32)> {
    let cache_key = format!("{}-{}", site_id, visitor_fingerprint);

    let entry = SESSION_CACHE.get(&cache_key)?;

    let result = entry.last_pageview.as_ref().and_then(|(prev_url, prev_ts)| {
        let secs = timestamp.signed_duration_since(*prev_ts).num_seconds();
        if secs >= 0 {
            Some((prev_url.clone(), secs as u32))
        } else {
            None
        }
    });

    let new_last_pageview = if event_type == "pageview" {
        Some((url.to_string(), timestamp))
    } else {
        // pagehide: clear so the next session's first pageview starts without stale duration
        None
    };

    SESSION_CACHE.insert(cache_key, SessionEntry {
        session_id: entry.session_id,
        created_at: entry.created_at,
        last_pageview: new_last_pageview,
    });

    result
}
