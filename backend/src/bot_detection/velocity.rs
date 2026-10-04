use crate::ip_parser::anonymize_ip;
use moka::sync::Cache;
use once_cell::sync::Lazy;
use std::hash::{Hash, Hasher};
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;

/// No human sustains this rate for a full minute, but CGNAT puts many visitors
/// behind one IP, so the threshold is high enough to avoid false positives.
pub const MAX_EVENTS_PER_MINUTE: u32 = 120;

/// The replay client flushes on a 5s timer but also whenever its buffer hits
/// 256KB uncompressed, so mutation-heavy pages upload well above 12/min per visitor.
pub const MAX_REPLAY_SEGMENTS_PER_MINUTE: u32 = 300;

static WINDOWS: Lazy<Cache<u64, Arc<AtomicU32>>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(60))
        .max_capacity(1_000_000)
        .build()
});

static REPLAY_WINDOWS: Lazy<Cache<u64, Arc<AtomicU32>>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(60))
        .max_capacity(1_000_000)
        .build()
});

/// Fixed one-minute window per site + anonymized IP
fn window(cache: &Cache<u64, Arc<AtomicU32>>, site_id: &str, ip_address: &str) -> Arc<AtomicU32> {
    let anonymized = anonymize_ip(ip_address);
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    site_id.hash(&mut hasher);
    anonymized.as_deref().unwrap_or(ip_address).hash(&mut hasher);
    cache.get_with(hasher.finish(), || Arc::new(AtomicU32::new(0)))
}

/// True when the window is already over the threshold; does not count the event
pub fn check(site_id: &str, ip_address: &str) -> bool {
    window(&WINDOWS, site_id, ip_address).load(Ordering::Relaxed) >= MAX_EVENTS_PER_MINUTE
}

/// Counts one event. Call only for events that were not enforced-rejected, so a
/// blocked bot flood cannot poison the window shared with humans behind the same IP
pub fn record(site_id: &str, ip_address: &str) {
    window(&WINDOWS, site_id, ip_address).fetch_add(1, Ordering::Relaxed);
}

pub fn check_replay(site_id: &str, ip_address: &str) -> bool {
    window(&REPLAY_WINDOWS, site_id, ip_address).load(Ordering::Relaxed) >= MAX_REPLAY_SEGMENTS_PER_MINUTE
}

/// Counts one segment upload. Counts requests, not accepted segments: bots are
/// already rejected before this point, so later validation failures still spend budget
pub fn record_replay(site_id: &str, ip_address: &str) {
    window(&REPLAY_WINDOWS, site_id, ip_address).fetch_add(1, Ordering::Relaxed);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stays_quiet_under_the_threshold() {
        for _ in 0..MAX_EVENTS_PER_MINUTE - 1 {
            record("site-under", "203.0.113.1");
            assert!(!check("site-under", "203.0.113.1"));
        }
    }

    #[test]
    fn flags_once_the_window_reaches_the_threshold() {
        for _ in 0..MAX_EVENTS_PER_MINUTE {
            record("site-over", "203.0.113.2");
        }
        assert!(check("site-over", "203.0.113.2"));
    }

    #[test]
    fn windows_are_isolated_per_site_and_subnet() {
        for _ in 0..=MAX_EVENTS_PER_MINUTE {
            record("site-a", "203.0.113.3");
        }
        assert!(!check("site-b", "203.0.113.3"));
        // v4 counts per anonymized /24, so isolation requires a different subnet
        assert!(!check("site-a", "198.51.100.7"));
    }

    #[test]
    fn ipv6_rotation_within_a_prefix_shares_one_window() {
        for n in 0..=MAX_EVENTS_PER_MINUTE {
            record("site-v6", &format!("2001:db8:1:2::{:x}", n + 1));
        }
        assert!(check("site-v6", "2001:db8:1:2::ffff"));
    }

    #[test]
    fn replay_flags_once_the_window_reaches_the_threshold() {
        for _ in 0..MAX_REPLAY_SEGMENTS_PER_MINUTE - 1 {
            record_replay("site-replay", "203.0.113.4");
            assert!(!check_replay("site-replay", "203.0.113.4"));
        }
        record_replay("site-replay", "203.0.113.4");
        assert!(check_replay("site-replay", "203.0.113.4"));
    }

    #[test]
    fn replay_and_event_windows_are_isolated() {
        for _ in 0..MAX_REPLAY_SEGMENTS_PER_MINUTE {
            record_replay("site-isolated", "203.0.113.5");
        }
        assert!(check_replay("site-isolated", "203.0.113.5"));
        assert!(!check("site-isolated", "203.0.113.5"));

        for _ in 0..MAX_EVENTS_PER_MINUTE {
            record("site-isolated-2", "203.0.113.6");
        }
        assert!(check("site-isolated-2", "203.0.113.6"));
        assert!(!check_replay("site-isolated-2", "203.0.113.6"));
    }
}
