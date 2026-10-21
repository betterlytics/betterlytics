use std::collections::{HashMap, HashSet};
use std::time::Duration as StdDuration;

use chrono::{DateTime, Utc};

use crate::monitor::{BackoffReason, BackoffSnapshot, MonitorCheck, ProbeOutcome};

const DEFAULT_MULTIPLIER: u64 = 2;
const DEFAULT_MAX_EFFECTIVE_SECS: u64 = 86_400;

const DEFAULT_FAILURE_THRESHOLD: u16 = 25;
const DEFAULT_SUCCESS_THRESHOLD: u16 = 2;

/// A restored result older than this many of its own effective intervals is ignored.
const SEED_MAX_AGE_INTERVALS: u32 = 3;

#[derive(Clone, Copy, Debug)]
pub struct BackoffPolicy {
    pub multiplier: u64,
    pub max_effective_secs: u64,
    pub failure_threshold: u16,
    pub success_threshold: u16,
}

impl Default for BackoffPolicy {
    fn default() -> Self {
        Self {
            multiplier: DEFAULT_MULTIPLIER,
            max_effective_secs: DEFAULT_MAX_EFFECTIVE_SECS,
            failure_threshold: DEFAULT_FAILURE_THRESHOLD,
            success_threshold: DEFAULT_SUCCESS_THRESHOLD,
        }
    }
}

/// The backoff level recorded on a check's latest result, used to restore it after a restart.
#[derive(Clone, Debug)]
pub struct BackoffSeed {
    pub ts: DateTime<Utc>,
    pub backoff_level: u8,
    pub effective_interval: StdDuration,
}

pub type BackoffSeeds = HashMap<String, BackoffSeed>;

impl BackoffSeed {
    /// A result from before the check was last saved, or one older than a few of its own
    /// intervals, says nothing about how the check is doing now.
    fn applies_to(&self, check: &MonitorCheck, now: DateTime<Utc>) -> bool {
        if self.ts < check.updated_at {
            return false;
        }
        let max_age = self.effective_interval.saturating_mul(SEED_MAX_AGE_INTERVALS);
        (now - self.ts).to_std().map_or(true, |age| age <= max_age)
    }
}

#[derive(Clone, Debug)]
struct BackoffState {
    base_interval: StdDuration,
    effective_interval: StdDuration,
    backoff_level: u8,
    consecutive_failures: u16,
    consecutive_successes: u16,
    reason: BackoffReason,
}

impl BackoffState {
    fn new(check: &MonitorCheck, policy: &BackoffPolicy) -> Self {
        let effective_interval = policy.interval_for_level(check.interval, 0);
        Self {
            base_interval: check.interval,
            effective_interval,
            backoff_level: 0,
            consecutive_failures: 0,
            consecutive_successes: 0,
            reason: BackoffReason::None,
        }
    }

    /// Re-applies the seed's level to the check's current interval. Streaks start at zero,
    /// as on any restart.
    fn restored(
        check: &MonitorCheck,
        seed: &BackoffSeed,
        policy: &BackoffPolicy,
        now: DateTime<Utc>,
    ) -> Self {
        let mut state = Self::new(check, policy);
        if !seed.applies_to(check, now) {
            return state;
        }
        let level = seed.backoff_level.min(policy.max_level(check.interval));
        if level > 0 {
            state.backoff_level = level;
            state.effective_interval = policy.interval_for_level(check.interval, level);
            state.reason = BackoffReason::Failure;
        }
        state
    }
}

pub struct BackoffController {
    policy: BackoffPolicy,
    states: HashMap<String, BackoffState>,
    seeds: BackoffSeeds,
}

impl BackoffController {
    /// Each seed is used once, when its check is first seen.
    pub fn new(policy: BackoffPolicy, seeds: BackoffSeeds) -> Self {
        Self {
            policy,
            states: HashMap::new(),
            seeds,
        }
    }

    pub fn current_snapshot(&mut self, check: &MonitorCheck) -> BackoffSnapshot {
        let policy = self.policy;
        let state = Self::ensure_state(policy, &mut self.states, &mut self.seeds, check);
        Self::to_snapshot(state)
    }

    pub fn prune_inactive(&mut self, active_ids: &HashSet<String>) {
        self.states.retain(|id, _| active_ids.contains(id));
        self.seeds.retain(|id, _| active_ids.contains(id));
    }

    pub fn apply_outcome(
        &mut self,
        check: &MonitorCheck,
        outcome: &ProbeOutcome,
    ) -> BackoffSnapshot {
        let policy = self.policy;
        let state = Self::ensure_state(policy, &mut self.states, &mut self.seeds, check);

        if outcome.success {
            state.consecutive_successes = state.consecutive_successes.saturating_add(1);
            state.consecutive_failures = 0;
            if state.backoff_level > 0 && state.consecutive_successes >= policy.success_threshold {
                state.backoff_level = 0;
                state.consecutive_successes = 0;
                state.reason = BackoffReason::None;
            }
        } else {
            state.consecutive_failures = state.consecutive_failures.saturating_add(1);
            state.consecutive_successes = 0;
            let max_level = policy.max_level(state.base_interval);
            if state.backoff_level < max_level
                && state.consecutive_failures >= policy.failure_threshold
            {
                state.backoff_level = state.backoff_level.saturating_add(1).min(max_level);
                state.consecutive_failures = 0;
                state.reason = BackoffReason::Failure;
            }
        }

        state.effective_interval =
            policy.interval_for_level(state.base_interval, state.backoff_level);

        Self::to_snapshot(state)
    }

    fn ensure_state<'a>(
        policy: BackoffPolicy,
        states: &'a mut HashMap<String, BackoffState>,
        seeds: &mut BackoffSeeds,
        check: &MonitorCheck,
    ) -> &'a mut BackoffState {
        let entry = states
            .entry(check.id.clone())
            .or_insert_with(|| match seeds.remove(&check.id) {
                Some(seed) => BackoffState::restored(check, &seed, &policy, Utc::now()),
                None => BackoffState::new(check, &policy),
            });

        // If the monitor's base interval changed, update and clamp the level
        if entry.base_interval != check.interval {
            entry.base_interval = check.interval;
            let max_level = policy.max_level(entry.base_interval);
            if entry.backoff_level > max_level {
                entry.backoff_level = max_level;
            }
            entry.effective_interval =
                policy.interval_for_level(entry.base_interval, entry.backoff_level);
        }

        entry
    }

    fn to_snapshot(state: &BackoffState) -> BackoffSnapshot {
        BackoffSnapshot {
            effective_interval: state.effective_interval,
            backoff_level: state.backoff_level,
            consecutive_failures: state.consecutive_failures,
            consecutive_successes: state.consecutive_successes,
            backoff_reason: state.reason,
        }
    }
}

impl BackoffPolicy {
    /// Level 0 is exactly the base interval; each level multiplies it, capped at
    /// `max_effective_secs` (a base already above the cap is left untouched).
    pub fn interval_for_level(&self, base: StdDuration, level: u8) -> StdDuration {
        let secs = base
            .as_secs()
            .saturating_mul(self.multiplier.saturating_pow(level as u32));
        StdDuration::from_secs(secs.min(self.cap_for(base)))
    }

    /// The lowest level at which the effective interval reaches the cap; escalating
    /// beyond it would not change anything.
    pub fn max_level(&self, base: StdDuration) -> u8 {
        if self.multiplier < 2 {
            return 0;
        }
        let cap = self.cap_for(base);
        let mut secs = base.as_secs().max(1);
        let mut level = 0u8;
        while secs < cap && level < u8::MAX {
            secs = secs.saturating_mul(self.multiplier);
            level += 1;
        }
        level
    }

    fn cap_for(&self, base: StdDuration) -> u64 {
        self.max_effective_secs.max(base.as_secs())
    }

    /// The oldest result that can still seed a check: one recorded at the capped interval.
    pub fn max_seed_age(&self) -> StdDuration {
        StdDuration::from_secs(self.max_effective_secs).saturating_mul(SEED_MAX_AGE_INTERVALS)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::monitor::{AlertConfig, HttpMethod, MonitorCheck, ReasonCode};
    use std::net::{IpAddr, Ipv4Addr};

    fn policy() -> BackoffPolicy {
        BackoffPolicy::default()
    }

    fn check(interval_secs: u64) -> MonitorCheck {
        MonitorCheck {
            id: "check-1".to_string(),
            dashboard_id: "dash-1".to_string(),
            site_id: "site-1".to_string(),
            name: None,
            url: url::Url::parse("https://example.com").unwrap(),
            interval: StdDuration::from_secs(interval_secs),
            timeout: StdDuration::from_secs(5),
            updated_at: chrono::Utc::now(),
            http_method: HttpMethod::Head,
            request_headers: Vec::new(),
            accepted_status_codes: Vec::new(),
            expected_keyword: None,
            check_ssl_errors: false,
            alert: AlertConfig::default(),
        }
    }

    fn success() -> ProbeOutcome {
        ProbeOutcome::success(
            StdDuration::from_millis(50),
            Some(200),
            IpAddr::V4(Ipv4Addr::LOCALHOST),
        )
    }

    fn failure() -> ProbeOutcome {
        ProbeOutcome::failure(StdDuration::from_millis(50), Some(503), ReasonCode::Http5xx)
    }

    fn minutes_ago(minutes: i64) -> DateTime<Utc> {
        Utc::now() - chrono::Duration::minutes(minutes)
    }

    /// A check last saved an hour ago, so recent seeds apply to it.
    fn saved_check(interval_secs: u64) -> MonitorCheck {
        MonitorCheck {
            updated_at: minutes_ago(60),
            ..check(interval_secs)
        }
    }

    fn seeds(level: u8, effective_secs: u64, ts: DateTime<Utc>) -> BackoffSeeds {
        let seed = BackoffSeed {
            ts,
            backoff_level: level,
            effective_interval: StdDuration::from_secs(effective_secs),
        };
        HashMap::from([("check-1".to_string(), seed)])
    }

    fn escalate(controller: &mut BackoffController, check: &MonitorCheck, levels: u16) {
        for _ in 0..policy().failure_threshold * levels {
            controller.apply_outcome(check, &failure());
        }
    }

    #[test]
    fn level_zero_is_exactly_the_base_interval() {
        // 44 minutes is not a "round" value; it must not be snapped to anything else.
        let base = StdDuration::from_secs(44 * 60);
        assert_eq!(policy().interval_for_level(base, 0), base);
    }

    #[test]
    fn levels_multiply_the_base_until_the_cap() {
        let p = policy();
        let base = StdDuration::from_secs(44 * 60);
        assert_eq!(p.interval_for_level(base, 1), StdDuration::from_secs(88 * 60));
        assert_eq!(p.interval_for_level(base, 2), StdDuration::from_secs(176 * 60));
        assert_eq!(
            p.interval_for_level(base, 6),
            StdDuration::from_secs(DEFAULT_MAX_EFFECTIVE_SECS)
        );
    }

    #[test]
    fn base_at_or_above_the_cap_never_escalates() {
        let p = policy();
        let day = StdDuration::from_secs(86_400);
        assert_eq!(p.max_level(day), 0);
        assert_eq!(p.interval_for_level(day, 5), day);

        let above_cap = StdDuration::from_secs(100_000);
        assert_eq!(p.max_level(above_cap), 0);
        assert_eq!(p.interval_for_level(above_cap, 5), above_cap);
    }

    #[test]
    fn max_level_reaches_the_cap_exactly_once() {
        let p = policy();
        let base = StdDuration::from_secs(60);
        let max = p.max_level(base);
        assert_eq!(max, 11); // 60 * 2^11 = 122880 >= 86400
        assert_eq!(
            p.interval_for_level(base, max),
            StdDuration::from_secs(DEFAULT_MAX_EFFECTIVE_SECS)
        );
        assert!(p.interval_for_level(base, max - 1) < StdDuration::from_secs(DEFAULT_MAX_EFFECTIVE_SECS));
    }

    #[test]
    fn controller_escalates_after_failure_threshold_and_recovers() {
        let p = policy();
        let mut controller = BackoffController::new(p, BackoffSeeds::new());
        let check = check(300);

        for _ in 0..p.failure_threshold - 1 {
            let snapshot = controller.apply_outcome(&check, &failure());
            assert_eq!(snapshot.backoff_level, 0);
            assert_eq!(snapshot.effective_interval, check.interval);
        }
        let snapshot = controller.apply_outcome(&check, &failure());
        assert_eq!(snapshot.backoff_level, 1);
        assert_eq!(snapshot.effective_interval, StdDuration::from_secs(600));

        let snapshot = controller.apply_outcome(&check, &success());
        assert_eq!(snapshot.backoff_level, 1);
        let snapshot = controller.apply_outcome(&check, &success());
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, check.interval);
        assert_eq!(snapshot.backoff_reason, BackoffReason::None);
    }

    #[test]
    fn two_successes_reset_a_deep_backoff_to_level_zero() {
        let mut controller = BackoffController::new(policy(), BackoffSeeds::new());
        let check = check(300);
        escalate(&mut controller, &check, 3);
        assert_eq!(controller.current_snapshot(&check).backoff_level, 3);

        let snapshot = controller.apply_outcome(&check, &success());
        assert_eq!(snapshot.backoff_level, 3);
        let snapshot = controller.apply_outcome(&check, &success());
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, check.interval);
        assert_eq!(snapshot.backoff_reason, BackoffReason::None);
    }

    #[test]
    fn seed_restores_the_level_with_fresh_streaks() {
        let check = saved_check(300);
        let mut controller = BackoffController::new(policy(), seeds(3, 2_400, minutes_ago(10)));

        let snapshot = controller.current_snapshot(&check);
        assert_eq!(snapshot.backoff_level, 3);
        assert_eq!(snapshot.effective_interval, StdDuration::from_secs(2_400));
        assert_eq!(snapshot.backoff_reason, BackoffReason::Failure);
        assert_eq!(snapshot.consecutive_failures, 0);
        assert_eq!(snapshot.consecutive_successes, 0);
    }

    #[test]
    fn seed_level_applies_to_the_current_interval_capped_at_the_ceiling() {
        // Recorded while the check ran every 5m; it now runs hourly, where level 5 hits 24h.
        let check = saved_check(3_600);
        let mut controller = BackoffController::new(policy(), seeds(8, 76_800, minutes_ago(10)));

        let snapshot = controller.current_snapshot(&check);
        assert_eq!(snapshot.backoff_level, 5);
        assert_eq!(
            snapshot.effective_interval,
            StdDuration::from_secs(DEFAULT_MAX_EFFECTIVE_SECS)
        );
    }

    #[test]
    fn seed_older_than_three_intervals_starts_at_level_zero() {
        let check = saved_check(300);

        let mut fresh = BackoffController::new(policy(), seeds(1, 600, minutes_ago(29)));
        assert_eq!(fresh.current_snapshot(&check).backoff_level, 1);

        let mut stale = BackoffController::new(policy(), seeds(1, 600, minutes_ago(31)));
        let snapshot = stale.current_snapshot(&check);
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, check.interval);
        assert_eq!(snapshot.backoff_reason, BackoffReason::None);
    }

    #[test]
    fn seed_from_before_the_last_save_starts_at_level_zero() {
        let check = MonitorCheck {
            updated_at: minutes_ago(5),
            ..check(300)
        };
        let mut controller = BackoffController::new(policy(), seeds(3, 2_400, minutes_ago(10)));

        let snapshot = controller.current_snapshot(&check);
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, check.interval);
    }

    #[test]
    fn restored_check_recovers_after_two_successes() {
        let check = saved_check(300);
        let mut controller = BackoffController::new(policy(), seeds(3, 2_400, minutes_ago(10)));

        assert_eq!(controller.apply_outcome(&check, &success()).backoff_level, 3);
        let snapshot = controller.apply_outcome(&check, &success());
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, check.interval);
    }
}
