//! Per-domain rate limiter to prevent abuse.
//!
//! Limits how frequently probes can target any single domain, protecting
//! external servers from being overwhelmed if users add many monitors
//! for the same domain.

use dashmap::DashMap;
use governor::{
    Quota, RateLimiter,
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
};
use std::num::NonZeroU32;
use std::time::{Duration, Instant};

struct LimiterEntry {
    limiter: RateLimiter<NotKeyed, InMemoryState, DefaultClock>,
    last_used: Instant,
}

/// Global rate limiter keyed by domain.
/// Uses GCRA (Generic Cell Rate Algorithm) via the `governor` crate,
/// which is functionally equivalent to a leaky bucket.
pub struct DomainRateLimiter {
    limiters: DashMap<String, LimiterEntry>,
    quota: Quota,
    stale_threshold: Duration,
}

impl DomainRateLimiter {
    pub fn new(requests_per_period: u32, period: Duration) -> Self {
        let quota = Quota::with_period(period)
            .expect("period must be positive")
            .allow_burst(NonZeroU32::new(requests_per_period).expect("requests must be positive"));

        Self {
            limiters: DashMap::new(),
            quota,
            stale_threshold: Duration::from_secs(3600), // 1 hour
        }
    }

    pub fn check(&self, domain: &str) -> bool {
        let now = Instant::now();

        let mut entry = self.limiters
            .entry(domain.to_lowercase())
            .or_insert_with(|| LimiterEntry {
                limiter: RateLimiter::direct(self.quota),
                last_used: now,
            });

        entry.last_used = now;

        entry.limiter.check().is_ok()
    }

    pub fn prune_stale(&self) {
        let cutoff = Instant::now() - self.stale_threshold;
        self.limiters.retain(|_, entry| entry.last_used > cutoff);
    }
}

impl Default for DomainRateLimiter {
    fn default() -> Self {
        Self::new(1, Duration::from_secs(5))
    }
}