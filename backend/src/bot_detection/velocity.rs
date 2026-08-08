use crate::ip_parser::anonymize_ip;
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

/// Fixed one-minute window per site + anonymized IP (/24 for v4, /64 for v6),
/// matching the invariant that no derived computation uses the full IP. The
/// prefix key also stops IPv6 rotation within a /64 from evading the counter;
/// v4 /24 pooling (up to 256 neighbors) is accepted while the signal is
/// shadow-only. A hash collision only perturbs a shadow counter.
fn window(site_id: &str, ip_address: &str) -> Arc<AtomicU32> {
    let anonymized = anonymize_ip(ip_address);
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    site_id.hash(&mut hasher);
    anonymized.as_deref().unwrap_or(ip_address).hash(&mut hasher);
    WINDOWS.get_with(hasher.finish(), || Arc::new(AtomicU32::new(0)))
}

/// True when the window is already over the threshold; does not count the event
pub fn check(site_id: &str, ip_address: &str) -> bool {
    window(site_id, ip_address).load(Ordering::Relaxed) >= MAX_EVENTS_PER_MINUTE
}

/// Counts one event. Call only for events that were not enforced-rejected, so a
/// blocked bot flood cannot poison the window shared with humans behind the same IP
pub fn record(site_id: &str, ip_address: &str) {
    window(site_id, ip_address).fetch_add(1, Ordering::Relaxed);
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
}
