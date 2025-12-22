//! Incident evaluator - maintains per-monitor incident state and evaluates probe results
//! into incident and SSL events. It does not send notifications directly; callers
//! decide when and how to notify based on the emitted events.

use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use tracing::{debug, error, info};
use uuid::Uuid;

use crate::monitor::{MonitorStatus, ReasonCode};

use super::{IncidentState, IncidentSeverity, IncidentSeed, IncidentSnapshot};


#[derive(Clone, Debug)]
struct MonitorIncidentState {
    /// Lifecycle and identity for the current incident (if any)
    incident_id: Option<Uuid>,
    state: IncidentState,
    severity: IncidentSeverity,
    started_at: Option<DateTime<Utc>>,
    last_event_at: Option<DateTime<Utc>>,
    resolved_at: Option<DateTime<Utc>>,

    /// Probe-derived state
    is_down: bool,
    down_since: Option<DateTime<Utc>>,
    last_status: Option<MonitorStatus>,

    /// Last observed error details for this incident (for persistence)
    last_error_reason_code: Option<ReasonCode>,
    last_error_status_code: Option<u16>,

    /// Counters
    consecutive_failures: u16,
    consecutive_successes: u16,
    failure_count: u16,
}


impl Default for MonitorIncidentState {
    fn default() -> Self {
        Self {
            incident_id: None,
            state: IncidentState::Resolved,
            severity: IncidentSeverity::Critical,
            started_at: None,
            last_event_at: None,
            resolved_at: None,
            is_down: false,
            down_since: None,
            last_status: None,
            last_error_reason_code: None,
            last_error_status_code: None,
            consecutive_failures: 0,
            consecutive_successes: 0,
            failure_count: 0,
        }
    }
}

/// Configuration for the incident evaluator
#[derive(Clone, Copy, Debug)]
pub struct IncidentEvaluatorConfig {
    /// Consecutive successes required to consider an incident recovered
    pub recovery_success_threshold: u16,
}

impl Default for IncidentEvaluatorConfig {
    fn default() -> Self {
        Self {
            // One healthy check is enough to call it recovered
            recovery_success_threshold: 1, // TODO: Allow users to configure this as an advanced setting?
        }
    }
}

/// Incident lifecycle events emitted by the evaluator
#[derive(Clone, Debug)]
pub enum IncidentEvent {
    /// A new incident opened
    Opened {
        incident_id: Uuid,
    },
    /// Ongoing incident got another failing signal
    Updated {
        incident_id: Uuid,
    },
    /// Incident resolved
    Resolved {
        incident_id: Uuid,
        downtime_duration: Option<Duration>,
    },
}

/// Tracks incident state for all monitors and decides when to notify
pub struct IncidentEvaluator {
    states: DashMap<String, MonitorIncidentState>,
    config: IncidentEvaluatorConfig,
}

impl IncidentEvaluator {
    pub fn new(config: IncidentEvaluatorConfig) -> Self {
        Self {
            states: DashMap::new(),
            config,
        }
    }

    /// Evaluate a failing probe. Opens/updates an incident and returns
    /// whether we should notify about the down state.
    pub fn evaluate_failure(
        &self,
        check_id: &str,
        status: MonitorStatus,
        consecutive_failures: u16,
        failure_threshold: i32,
    ) -> Option<IncidentEvent> {
        let mut state = self.states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.last_status = Some(status);

        // Check if we already have an open incident (e.g., warmed from database after restart)
        let already_open = matches!(state.state, IncidentState::Open) && state.incident_id.is_some();

        debug!(
            check_id = check_id,
            ?status,
            consecutive_failures,
            failure_threshold,
            already_open,
            "evaluating failure for monitor"
        );

        // Skip threshold check if incident is already open - threshold only gates opening NEW incidents
        if !already_open && consecutive_failures < failure_threshold as u16 {
            state.consecutive_failures = consecutive_failures;
            debug!(
                check_id = check_id,
                consecutive_failures,
                failure_threshold,
                "not opening incident yet: below failure threshold"
            );
            return None;
        }

        let was_open = matches!(state.state, IncidentState::Open);
        let was_resolved = matches!(state.state, IncidentState::Resolved);

        // Start a new incident if there was no previous one OR the prior one
        // has been fully resolved. This guarantees that once an incident is
        // resolved, a future outage creates a new incident_id.
        if was_resolved || state.incident_id.is_none() {
            state.incident_id = Some(Uuid::new_v4());
            state.started_at = None;
            state.resolved_at = None;
            state.failure_count = 0;
        }

        state.state = IncidentState::Open;
        state.is_down = true;
        state.down_since.get_or_insert(now);
        state.started_at.get_or_insert(now);
        state.last_event_at = Some(now);
        state.failure_count = state.failure_count.saturating_add(1);
        state.consecutive_failures = consecutive_failures;
        state.consecutive_successes = 0;

        let Some(incident_id) = state.incident_id else {
            error!(
                check_id = check_id,
                "BUG: incident_id unexpectedly None after state update"
            );
            return None;
        };

        if was_open {
            Some(IncidentEvent::Updated {
                incident_id,
            })
        } else {
            Some(IncidentEvent::Opened {
                incident_id,
            })
        }
    }

    /// Evaluate a healthy probe. If the monitor had an open incident,
    /// it will be marked resolved and may generate a recovery notification.
    pub fn evaluate_recovery(
        &self,
        check_id: &str,
        status: MonitorStatus,
    ) -> Option<IncidentEvent> {
        let mut state = self.states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.last_status = Some(status);

        let has_open_incident = matches!(state.state, IncidentState::Open) && state.is_down;

        if !has_open_incident {
            // Only track consecutive successes when we have an open incident
            // to avoid unnecessary state accumulation
            debug!(
                check_id = check_id,
                "no open incident; skipping recovery evaluation"
            );
            return None;
        }

        // Require a configurable number of successes before recovery
        state.consecutive_successes = state.consecutive_successes.saturating_add(1);
        if state.consecutive_successes < self.config.recovery_success_threshold {
            debug!(
                check_id = check_id,
                consecutive_successes = state.consecutive_successes,
                recovery_success_threshold = self.config.recovery_success_threshold,
                "keeping incident open: below recovery success threshold"
            );
            return None;
        }

        let incident_id = match state.incident_id {
            Some(id) => id,
            None => {
                error!(check_id = check_id, "Recovery attempted with no active incident");
                return None;
            }
        };
        let downtime_duration = state.down_since.map(|t| now.signed_duration_since(t));

        state.state = IncidentState::Resolved;
        state.is_down = false;
        state.down_since = None;
        state.resolved_at = Some(now);
        state.last_event_at = Some(now);
        state.failure_count = 0;
        state.consecutive_failures = 0;

        debug!(
            check_id = check_id,
            incident_id = %incident_id,
            ?downtime_duration,
            "incident resolved after sufficient consecutive successes"
        );

        Some(IncidentEvent::Resolved {
            incident_id,
            downtime_duration,
        })
    }

    /// Update the last observed error details for a monitor.
    ///
    /// This is called from the incident service on failing probes so that
    /// incident snapshots can persist a stable view of the most recent
    /// error, even after the monitor has recovered.
    pub fn update_error_metadata(
        &self,
        check_id: &str,
        reason_code: ReasonCode,
        status_code: Option<u16>,
    ) {
        let mut state = self.states.entry(check_id.to_string()).or_default();
        state.last_error_reason_code = Some(reason_code);
        state.last_error_status_code = status_code;
    }


    /// Remove state for monitors that no longer exist
    pub fn prune_inactive(&self, active_ids: &std::collections::HashSet<String>) {
        self.states.retain(|id, _| active_ids.contains(id));
    }

    /// Warm the evaluator from active incident snapshots
    pub fn warm_from_incidents(&self, seeds: &[IncidentSeed]) {
        if seeds.is_empty() {
            return;
        }

        let mut warm_count = 0;

        for seed in seeds {
            let mut state = self.states.entry(seed.check_id.clone()).or_default();
            state.incident_id = Some(seed.incident_id);
            state.state = seed.state;
            state.severity = seed.severity;
            state.started_at = Some(seed.started_at);
            state.last_event_at = Some(seed.last_event_at);
            state.resolved_at = seed.resolved_at;
            state.failure_count = seed.failure_count;
            state.last_status = seed.last_status;
            state.is_down = matches!(seed.state, IncidentState::Open);
            state.down_since = Some(seed.started_at);
            state.consecutive_failures = seed.failure_count;
            state.consecutive_successes = 0;
            state.last_error_reason_code = Some(seed.reason_code);
            state.last_error_status_code = seed.status_code;
            warm_count += 1;
        }

        info!(
            down_monitors = warm_count,
            "Incident evaluator warmed from incident snapshots"
        );
    }

    pub fn snapshot(&self, check_id: &str) -> Option<IncidentSnapshot> {
        let state = self.states.get(check_id)?;

        Some(IncidentSnapshot {
            incident_id: state.incident_id,
            state: state.state,
            severity: state.severity,
            started_at: state.started_at.or(state.down_since),
            last_event_at: state.last_event_at,
            resolved_at: state.resolved_at,
            failure_count: state.failure_count,
            last_status: state.last_status,
            last_error_reason_code: state.last_error_reason_code,
            last_error_status_code: state.last_error_status_code,
        })
    }
}
