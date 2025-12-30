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

impl MonitorIncidentState {
    fn mark_ongoing(&mut self, now: DateTime<Utc>, consecutive_failures: u16) {
        self.state = IncidentState::Ongoing;
        self.is_down = true;
        self.down_since.get_or_insert(now);
        self.started_at.get_or_insert(now);
        self.last_event_at = Some(now);
        self.failure_count = self.failure_count.saturating_add(1);
        self.consecutive_failures = consecutive_failures;
        self.consecutive_successes = 0;
    }

    fn resolve(&mut self, now: DateTime<Utc>) {
        self.state = IncidentState::Resolved;
        self.is_down = false;
        self.down_since = None;
        self.resolved_at = Some(now);
        self.last_event_at = Some(now);
        self.failure_count = 0;
        self.consecutive_failures = 0;
    }

    fn from_seed(seed: &IncidentSeed) -> Self {
        Self {
            incident_id: Some(seed.incident_id),
            state: seed.state,
            severity: seed.severity,
            started_at: Some(seed.started_at),
            last_event_at: Some(seed.last_event_at),
            resolved_at: seed.resolved_at,
            failure_count: seed.failure_count,
            last_status: seed.last_status,
            is_down: matches!(seed.state, IncidentState::Ongoing),
            down_since: Some(seed.started_at),
            last_error_reason_code: Some(seed.reason_code),
            last_error_status_code: seed.status_code,
            consecutive_failures: seed.failure_count,
            consecutive_successes: 0,
            ..Default::default()
        }
    }

    fn to_snapshot(&self) -> Option<IncidentSnapshot> {
        Some(IncidentSnapshot {
            incident_id: self.incident_id,
            state: self.state,
            severity: self.severity,
            started_at: self.started_at.or(self.down_since),
            last_event_at: self.last_event_at,
            resolved_at: self.resolved_at,
            failure_count: self.failure_count,
            last_status: self.last_status,
            last_error_reason_code: self.last_error_reason_code,
            last_error_status_code: self.last_error_status_code,
        })
    }
}


#[derive(Clone, Copy, Debug)]
pub struct IncidentEvaluatorConfig {
    pub recovery_success_threshold: u16,
}

impl Default for IncidentEvaluatorConfig {
    fn default() -> Self {
        Self {
            recovery_success_threshold: 2, // TODO: Allow users to configure this as an advanced setting
        }
    }
}

#[derive(Clone, Debug)]
pub enum IncidentEvent {
    Opened {
        incident_id: Uuid,
    },
    Updated {
        incident_id: Uuid,
    },
    Resolved {
        incident_id: Uuid,
        downtime_duration: Option<Duration>,
    },
}

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

    pub fn evaluate_failure(
        &self,
        check_id: &str,
        status: MonitorStatus,
        consecutive_failures: u16,
        failure_threshold: i32,
        reason_code: ReasonCode,
        status_code: Option<u16>,
    ) -> Option<IncidentEvent> {
        let mut state = self.states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.last_status = Some(status);
        state.last_error_reason_code = Some(reason_code);
        state.last_error_status_code = status_code;

        let already_open = matches!(state.state, IncidentState::Ongoing) && state.incident_id.is_some();

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

        let was_open = matches!(state.state, IncidentState::Ongoing);
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

        state.mark_ongoing(now, consecutive_failures);

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

    pub fn evaluate_recovery(
        &self,
        check_id: &str,
        status: MonitorStatus,
    ) -> Option<IncidentEvent> {
        let mut state = self.states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.last_status = Some(status);

        let has_open_incident = matches!(state.state, IncidentState::Ongoing) && state.is_down;

        if !has_open_incident {
            debug!(
                check_id = check_id,
                "no open incident; skipping recovery evaluation"
            );
            return None;
        }

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

        state.resolve(now);

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

    pub fn prune_inactive(&self, active_ids: &std::collections::HashSet<String>) {
        self.states.retain(|id, _| active_ids.contains(id));
    }

    pub fn warm_from_incidents(&self, seeds: &[IncidentSeed]) {
        if seeds.is_empty() {
            return;
        }

        let mut warm_count = 0;

        for seed in seeds {
            self.states.insert(seed.check_id.clone(), MonitorIncidentState::from_seed(seed));
            warm_count += 1;
        }

        info!(
            down_monitors = warm_count,
            "Incident evaluator warmed from incident snapshots"
        );
    }

    pub fn snapshot(&self, check_id: &str) -> Option<IncidentSnapshot> {
        self.states.get(check_id)?.to_snapshot()
    }
}
