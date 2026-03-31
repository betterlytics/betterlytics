use anyhow::Result;
use moka::sync::Cache;
use std::time::Duration;
use once_cell::sync::Lazy;
use chrono::{DateTime, Utc};

const SESSION_EXPIRY: Duration = Duration::from_secs(30 * 60);

#[derive(Clone)]
pub struct SessionInfo {
    pub session_id: String,
    pub created_at: DateTime<Utc>,
}

// Moka cache with time-based eviction (sessions expire after 30 minutes of inactivity)
static SESSION_CACHE: Lazy<Cache<String, SessionInfo>> = Lazy::new(|| {
    Cache::builder()
        .time_to_idle(SESSION_EXPIRY)
        .build()
});

/// Generate a new session ID
fn generate_session_id() -> String {
    nanoid::nanoid!(16)
}

/// Get or create a session for a visitor, returning both the session ID and its creation time.
/// The creation time is fixed at first-event time and never changes for the lifetime of a session.
pub fn get_or_create_session(
    site_id: &str,
    visitor_fingerprint: u64,
    event_timestamp: DateTime<Utc>,
) -> Result<SessionInfo> {
    let cache_key = format!("{}-{}", site_id, visitor_fingerprint);

    // Check if the session exists in the cache - this will refresh the idle timer
    if let Some(info) = SESSION_CACHE.get(&cache_key) {
        return Ok(info);
    }

    // Create a new session if one doesn't exist or was evicted due to inactivity
    let info = SessionInfo {
        session_id: generate_session_id(),
        created_at: event_timestamp,
    };

    SESSION_CACHE.insert(cache_key, info.clone());

    Ok(info)
}
