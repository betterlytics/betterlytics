use std::collections::{HashMap, HashSet};
use std::time::Duration as StdDuration;

use crate::monitor::{BackoffReason, BackoffSnapshot, MonitorCheck, ProbeOutcome};

const DEFAULT_MULTIPLIER: u64 = 2;
const DEFAULT_MAX_EFFECTIVE_SECS: u64 = 86_400;

const DEFAULT_FAILURE_THRESHOLD: u16 = 25;
const DEFAULT_SUCCESS_THRESHOLD: u16 = 2;

/// Escalation is defined relative to the monitor's own base interval (base × multiplier^level,
/// capped), so the policy is independent of whichever interval values the dashboard offers.
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
    fn new(base_interval: StdDuration, policy: &BackoffPolicy) -> Self {
        let effective_interval = policy.interval_for_level(base_interval, 0);
        Self {
            base_interval,
            effective_interval,
            backoff_level: 0,
            consecutive_failures: 0,
            consecutive_successes: 0,
            reason: BackoffReason::None,
        }
    }
}

pub struct BackoffController {
    policy: BackoffPolicy,
    states: HashMap<String, BackoffState>,
}

impl BackoffController {
    pub fn new(policy: BackoffPolicy) -> Self {
        Self {
            policy,
            states: HashMap::new(),
        }
    }

    pub fn current_snapshot(&mut self, check: &MonitorCheck) -> BackoffSnapshot {
        let policy = self.policy;
        let state = Self::ensure_state(policy, &mut self.states, check);
        Self::to_snapshot(state)
    }

    pub fn prune_inactive(&mut self, active_ids: &HashSet<String>) {
        self.states.retain(|id, _| active_ids.contains(id));
    }

    pub fn apply_outcome(
        &mut self,
        check: &MonitorCheck,
        outcome: &ProbeOutcome,
    ) -> BackoffSnapshot {
        let policy = self.policy;
        let state = Self::ensure_state(policy, &mut self.states, check);

        if outcome.success {
            state.consecutive_successes = state.consecutive_successes.saturating_add(1);
            state.consecutive_failures = 0;
            if state.backoff_level > 0 && state.consecutive_successes >= policy.success_threshold {
                state.backoff_level = state.backoff_level.saturating_sub(1);
                state.consecutive_successes = 0;
                if state.backoff_level == 0 {
                    state.reason = BackoffReason::None;
                }
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
        check: &MonitorCheck,
    ) -> &'a mut BackoffState {
        let entry = states
            .entry(check.id.clone())
            .or_insert_with(|| BackoffState::new(check.interval, &policy));

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
        let mut controller = BackoffController::new(p);
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
    }

    #[test]
    fn base_interval_change_reclamps_the_level() {
        let p = policy();
        let mut controller = BackoffController::new(p);
        let slow = check(86_400);

        // Escalate a 5m monitor one level, then simulate the user changing it to 24h.
        let fast = check(300);
        for _ in 0..p.failure_threshold {
            controller.apply_outcome(&fast, &failure());
        }
        let snapshot = controller.current_snapshot(&slow);
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, slow.interval);
    }
}