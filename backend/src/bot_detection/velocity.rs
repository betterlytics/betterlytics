use moka::sync::Cache;
use once_cell::sync::Lazy;
use std::hash::{Hash, Hasher};
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;

/// No human sustains this rate for a full minute, but CGNAT puts many visitors
/// behind one IP — shadow-only until bot_events data justifies enforcement
pub const MAX_EVENTS_PER_MINUTE: u32 = 120;

static WINDOWS: Lazy<Cache<u64, Arc<AtomicU32>>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(60))
        .max_capacity(1_000_000)
        .build()
});

/// Fixed one-minute window per site+IP, keyed by hash — a collision only
/// perturbs a shadow counter
pub fn record_and_check(site_id: &str, ip_address: &str) -> bool {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    site_id.hash(&mut hasher);
    ip_address.hash(&mut hasher);
    let counter = WINDOWS.get_with(hasher.finish(), || Arc::new(AtomicU32::new(0)));
    counter.fetch_add(1, Ordering::Relaxed) + 1 > MAX_EVENTS_PER_MINUTE
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stays_quiet_under_the_threshold() {
        for _ in 0..MAX_EVENTS_PER_MINUTE {
            assert!(!record_and_check("site-under", "203.0.113.1"));
        }
    }

    #[test]
    fn flags_once_the_window_exceeds_the_threshold() {
        for _ in 0..MAX_EVENTS_PER_MINUTE {
            record_and_check("site-over", "203.0.113.2");
        }
        assert!(record_and_check("site-over", "203.0.113.2"));
    }

    #[test]
    fn windows_are_isolated_per_site_and_ip() {
        for _ in 0..=MAX_EVENTS_PER_MINUTE {
            record_and_check("site-a", "203.0.113.3");
        }
        assert!(!record_and_check("site-b", "203.0.113.3"));
        assert!(!record_and_check("site-a", "203.0.113.4"));
    }
}
