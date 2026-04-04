use anyhow::Result;
use chrono::{DateTime, Utc};
use moka::sync::Cache;
use std::time::Duration;
use once_cell::sync::Lazy;
use rand::Rng;

const SESSION_EXPIRY: Duration = Duration::from_secs(30 * 60);

static SESSION_CACHE: Lazy<Cache<String, (u64, DateTime<Utc>)>> = Lazy::new(|| {
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
        return Ok(entry);
    }

    let new_session_id = generate_session_id();
    let created_at = Utc::now();

    SESSION_CACHE.insert(cache_key, (new_session_id, created_at));

    Ok((new_session_id, created_at))
}
