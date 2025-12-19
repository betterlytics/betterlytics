//! Alert tracker - maintains per-monitor incident state and evaluates probe results
//! into incident and SSL events. It does not send notifications directly; callers
//! decide when and how to notify based on the emitted events.

use chrono::{DateTime, Duration, Utc};
use std::collections::HashMap;
use tokio::sync::RwLock;
use tracing::{debug, error, info};
use uuid::Uuid;
use serde_repr::{Serialize_repr, Deserialize_repr};

use crate::monitor::MonitorStatus;

use crate::monitor::incident_store::IncidentSeed;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AlertType {
    Down,
    Recovery,
    SslExpiring,
    SslExpired,
}

impl AlertType {
    pub fn as_str(&self) -> &'static str {
        match self {
            AlertType::Down => "down",
            AlertType::Recovery => "recovery",
            AlertType::SslExpiring => "ssl_expiring",
            AlertType::SslExpired => "ssl_expired",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize_repr, Deserialize_repr)]
#[repr(i8)]
pub enum IncidentState {
    Open = 1,
    Resolved = 2,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize_repr, Deserialize_repr)]
#[repr(i8)]
pub enum IncidentSeverity {
    Info = 1,
    Warning = 2,
    Critical = 3,
}

#[derive(Clone, Debug)]
struct MonitorAlertState {
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
    /// Whether the monitor is currently considered flapping
    is_flapping: bool,

    /// Last observed error details for this incident (for persistence)
    last_error_reason_code: Option<String>,
    last_error_status_code: Option<u16>,
    last_error_message: Option<String>,

    /// SSL alert tracking
    last_ssl_days_left: Option<i32>,

    /// Counters
    consecutive_failures: u16,
    consecutive_successes: u16,
    failure_count: u16,
    flap_count: u16,
}

#[derive(Clone, Debug)]
pub struct IncidentSnapshot {
    pub incident_id: Option<Uuid>,
    pub state: IncidentState,
    pub severity: IncidentSeverity,
    pub started_at: Option<DateTime<Utc>>,
    pub last_event_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub failure_count: u16,
    pub flap_count: u16,
    pub last_status: Option<MonitorStatus>,
    pub last_error_reason_code: Option<String>,
    pub last_error_status_code: Option<u16>,
    pub last_error_message: Option<String>,
}

impl Default for MonitorAlertState {
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
            is_flapping: false,
            last_error_reason_code: None,
            last_error_status_code: None,
            last_error_message: None,
            last_ssl_days_left: None,
            consecutive_failures: 0,
            consecutive_successes: 0,
            failure_count: 0,
            flap_count: 0,
        }
    }
}

/// Configuration for the alert tracker / incident evaluator
#[derive(Clone, Copy, Debug)]
pub struct AlertTrackerConfig {
    /// Consecutive successes required to consider an incident recovered
    pub recovery_success_threshold: u16,
}

impl Default for AlertTrackerConfig {
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

/// SSL-specific events emitted by the evaluator
#[derive(Clone, Debug)]
pub enum SslEvent {
    Expiring {
        incident_id: Uuid,
    },
    Expired {
        incident_id: Uuid,
    },
}

/// Tracks incident state for all monitors and decides when to notify
pub struct AlertTracker {
    states: RwLock<HashMap<String, MonitorAlertState>>,
    config: AlertTrackerConfig,
}

impl AlertTracker {
    pub fn new(config: AlertTrackerConfig) -> Self {
        Self {
            states: RwLock::new(HashMap::new()),
            config,
        }
    }

    /// Evaluate a failing probe. Opens/updates an incident and returns
    /// whether we should notify about the down state.
    pub async fn evaluate_failure(
        &self,
        check_id: &str,
        status: MonitorStatus,
        consecutive_failures: u16,
        failure_threshold: i32,
    ) -> Option<IncidentEvent> {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.last_status = Some(status);

        debug!(
            check_id = check_id,
            ?status,
            consecutive_failures,
            failure_threshold,
            "evaluating failure for monitor"
        );

        // Not past the alerting threshold yet
        if consecutive_failures < failure_threshold as u16 {
            state.consecutive_failures = consecutive_failures;
            debug!(
                check_id = check_id,
                consecutive_failures,
                failure_threshold,
                "not opening/updating incident yet: below failure threshold"
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
            state.flap_count = 0;
        }

        state.state = IncidentState::Open;
        state.is_down = true;
        state.down_since.get_or_insert(now);
        state.started_at.get_or_insert(now);
        state.last_event_at = Some(now);
        state.failure_count = state.failure_count.saturating_add(1);
        state.consecutive_failures = consecutive_failures;
        state.consecutive_successes = 0;

        let incident_id = state
            .incident_id
            .expect("incident_id must be set when opening/updating incident");

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

    /// Evaluate a healthy probe. If the monitor had an open/flapping incident,
    /// it will be marked resolved and may generate a recovery notification.
    pub async fn evaluate_recovery(
        &self,
        check_id: &str,
        status: MonitorStatus,
    ) -> Option<IncidentEvent> {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.last_status = Some(status);

        let has_open_incident = matches!(state.state, IncidentState::Open) && state.is_down;

        if !has_open_incident {
            state.consecutive_successes = state.consecutive_successes.saturating_add(1);
            debug!(
                check_id = check_id,
                consecutive_successes = state.consecutive_successes,
                "no open incident; counting success toward recovery threshold"
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
    /// This is called from the alert service on failing probes so that
    /// incident snapshots can persist a stable view of the most recent
    /// error, even after the monitor has recovered.
    pub async fn update_error_metadata(
        &self,
        check_id: &str,
        reason_code: Option<String>,
        status_code: Option<u16>,
        error_message: Option<String>,
    ) {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();

        if let Some(code) = reason_code {
            state.last_error_reason_code = Some(code);
        }
        state.last_error_status_code = status_code;
        state.last_error_message = error_message;
    }

    /// Check if an SSL expiry alert should be sent
    pub async fn should_alert_ssl_expiry(
        &self,
        check_id: &str,
        days_left: i32,
        alert_threshold_days: i32,
    ) -> Option<SslEvent> {
        if days_left > alert_threshold_days {
            debug!(
                check_id = check_id,
                days_left,
                alert_threshold_days,
                "not emitting SSL event: above alert threshold"
            );
            return None;
        }

        let mut states = self.states.write().await;

        let should_alert = match states.get(check_id) {
            Some(state) => {
                // Alert if days_left decreased significantly (crossed threshold)
                let decision = state
                    .last_ssl_days_left
                    .map(|last| days_left < last && (last - days_left) >= 7)
                    .unwrap_or(true);

                if !decision {
                    debug!(
                        check_id = check_id,
                        days_left,
                        last_ssl_days_left = state.last_ssl_days_left,
                        "not emitting SSL event: change in days_left below 7-day delta"
                    );
                }

                decision
            }
            None => true,
        };

        if should_alert {
            if let Some(state) = states.get_mut(check_id) {
                state.last_ssl_days_left = Some(days_left);
            }

            let incident_id = Uuid::new_v4();
            if days_left <= 0 {
                debug!(
                    check_id = check_id,
                    days_left,
                    incident_id = %incident_id,
                    "emitting SSL Expired event"
                );
                Some(SslEvent::Expired { incident_id })
            } else {
                debug!(
                    check_id = check_id,
                    days_left,
                    incident_id = %incident_id,
                    "emitting SSL Expiring event"
                );
                Some(SslEvent::Expiring { incident_id })
            }
        } else {
            None
        }
    }

    /// Remove state for monitors that no longer exist
    pub async fn prune_inactive(&self, active_ids: &std::collections::HashSet<String>) {
        let mut states = self.states.write().await;
        states.retain(|id, _| active_ids.contains(id));
    }

    /// Warm the tracker from active incident snapshots
    pub async fn warm_from_incidents(&self, seeds: &[IncidentSeed]) {
        if seeds.is_empty() {
            return;
        }

        let mut states = self.states.write().await;
        let mut warm_count = 0;

        for seed in seeds {
            let state = states.entry(seed.check_id.clone()).or_default();
            state.incident_id = Some(seed.incident_id);
            state.state = seed.state;
            state.severity = seed.severity;
            state.started_at = Some(seed.started_at);
            state.last_event_at = Some(seed.last_event_at);
            state.resolved_at = seed.resolved_at;
            state.failure_count = seed.failure_count;
            state.flap_count = seed.flap_count;
            state.last_status = seed.last_status;
            state.is_down = matches!(seed.state, IncidentState::Open);
            state.down_since = Some(seed.started_at);
            state.consecutive_failures = seed.failure_count;
            state.consecutive_successes = 0;
            state.last_error_reason_code = Some(seed.reason_code.clone());
            state.last_error_status_code = seed.status_code;
            state.last_error_message = Some(seed.error_message.clone());
            warm_count += 1;
        }

        info!(
            down_monitors = warm_count,
            "Alert tracker warmed from incident snapshots"
        );
    }

    pub async fn snapshot(&self, check_id: &str) -> Option<IncidentSnapshot> {
        let states = self.states.read().await;
        let state = states.get(check_id)?;

        Some(IncidentSnapshot {
            incident_id: state.incident_id,
            state: state.state,
            severity: state.severity,
            started_at: state.started_at.or(state.down_since),
            last_event_at: state.last_event_at,
            resolved_at: state.resolved_at,
            failure_count: state.failure_count,
            flap_count: state.flap_count,
            last_status: state.last_status,
            last_error_reason_code: state.last_error_reason_code.clone(),
            last_error_status_code: state.last_error_status_code,
            last_error_message: state.last_error_message.clone(),
        })
    }
}
