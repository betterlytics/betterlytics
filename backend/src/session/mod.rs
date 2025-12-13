use anyhow::Result;
use moka::sync::Cache;
use once_cell::sync::Lazy;
use std::time::Duration;

const SESSION_EXPIRY: Duration = Duration::from_secs(30 * 60);

// Moka cache with time-based eviction (sessions expire after 30 minutes of inactivity)
static SESSION_CACHE: Lazy<Cache<String, String>> =
    Lazy::new(|| Cache::builder().time_to_idle(SESSION_EXPIRY).build());

/// Generate a new session ID
fn generate_session_id() -> String {
    nanoid::nanoid!(16)
}

/// Get or create a session ID for a visitor
pub fn get_or_create_session_id(site_id: &str, visitor_fingerprint: &str) -> Result<String> {
    let cache_key = format!("{}-{}", site_id, visitor_fingerprint);

    // Check if the session ID exists in the cache - this will refresh the idle timer
    if let Some(session_id) = SESSION_CACHE.get(&cache_key) {
        return Ok(session_id);
    }

    // Create a new session if one doesn't exist or was evicted due to inactivity
    let new_session_id = generate_session_id();

    SESSION_CACHE.insert(cache_key, new_session_id.clone());

    Ok(new_session_id)
}
