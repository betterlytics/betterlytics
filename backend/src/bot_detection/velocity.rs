use moka::sync::Cache;
use once_cell::sync::Lazy;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;

/// Deliberately generous: no human browsing pattern sustains this rate for a full
/// minute, but CGNAT puts many real visitors behind one IP, so hits are shadow-only
/// telemetry until bot_events data justifies enforcement
pub const MAX_EVENTS_PER_MINUTE: u32 = 120;

static WINDOWS: Lazy<Cache<String, Arc<AtomicU32>>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(60))
        .max_capacity(1_000_000)
        .build()
});

/// Counts this event against the site+IP fixed one-minute window and reports
/// whether the window is over the threshold
pub fn record_and_check(site_id: &str, ip_address: &str) -> bool {
    let key = format!("{}-{}", site_id, ip_address);
    let counter = WINDOWS.get_with(key, || Arc::new(AtomicU32::new(0)));
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
