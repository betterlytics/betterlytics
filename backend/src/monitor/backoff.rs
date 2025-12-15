use std::collections::{HashMap, HashSet};
use std::time::Duration as StdDuration;

use crate::monitor::{BackoffReason, BackoffSnapshot, MonitorCheck, ProbeOutcome};

const DEFAULT_ALLOWED_INTERVALS_SECS: &[u64] =
    &[30, 60, 120, 180, 240, 300, 600, 900, 1800, 3600, 7200, 10_800, 21_600];
// Require consecutive failures before increasing backoff to avoid premature slowdown on short intervals.
const DEFAULT_FAILURE_THRESHOLD: u16 = 25;
const DEFAULT_SUCCESS_THRESHOLD: u16 = 2;

#[derive(Clone, Copy, Debug)]
pub struct BackoffPolicy {
    pub allowed_intervals_secs: &'static [u64],
    pub failure_threshold: u16,
    pub success_threshold: u16,
}

impl Default for BackoffPolicy {
    fn default() -> Self {
        Self {
            allowed_intervals_secs: DEFAULT_ALLOWED_INTERVALS_SECS,
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
                state.backoff_level = (state.backoff_level + 1).min(max_level);
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

        // If the monitor's base interval changed, update and clamp the level.
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
    pub fn interval_for_level(&self, base: StdDuration, level: u8) -> StdDuration {
        if self.allowed_intervals_secs.is_empty() {
            return base;
        }

        let base_secs = base.as_secs();
        let maybe_base_idx = self
            .allowed_intervals_secs
            .iter()
            .position(|&v| v >= base_secs);

        let base_idx = match maybe_base_idx {
            Some(idx) => idx,
            None => return base,
        };

        let target_idx =
            (base_idx + level as usize).min(self.allowed_intervals_secs.len() - 1);
        StdDuration::from_secs(self.allowed_intervals_secs[target_idx])
    }

    pub fn max_level(&self, base: StdDuration) -> u8 {
        if self.allowed_intervals_secs.is_empty() {
            return 0;
        }

        let base_secs = base.as_secs();
        let base_idx = self
            .allowed_intervals_secs
            .iter()
            .position(|&v| v >= base_secs)
            .unwrap_or(self.allowed_intervals_secs.len() - 1);
        let max_steps = (self.allowed_intervals_secs.len() - 1) - base_idx;
        max_steps as u8
    }
}