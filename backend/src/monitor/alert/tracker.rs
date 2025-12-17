use chrono::{DateTime, Duration, Utc};
use std::collections::{HashMap, VecDeque};
use tokio::sync::RwLock;
use tracing::{error, info};
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
    Flapping = 3,
    Muted = 4,
}

#[allow(dead_code)]
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

    /// Notification timestamps
    notified_down_at: Option<DateTime<Utc>>,
    notified_recovery_at: Option<DateTime<Utc>>,
    notified_flap_at: Option<DateTime<Utc>>,

    /// SSL alert tracking
    last_ssl_alert: Option<DateTime<Utc>>,
    last_ssl_days_left: Option<i32>,

    /// Counters
    consecutive_failures: u16,
    consecutive_successes: u16,
    failure_count: u16,
    flap_count: u16,

    /// Rolling transition timestamps for flapping detection
    transitions: VecDeque<DateTime<Utc>>,
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
}

impl Default for MonitorAlertState {
    fn default() -> Self {
        Self {
            incident_id: None,
            state: IncidentState::Resolved,
            severity: IncidentSeverity::Warning,
            started_at: None,
            last_event_at: None,
            resolved_at: None,
            is_down: false,
            down_since: None,
            last_status: None,
            notified_down_at: None,
            notified_recovery_at: None,
            notified_flap_at: None,
            last_ssl_alert: None,
            last_ssl_days_left: None,
            consecutive_failures: 0,
            consecutive_successes: 0,
            failure_count: 0,
            flap_count: 0,
            transitions: VecDeque::new(),
        }
    }
}

/// Configuration for the alert tracker / incident evaluator
#[derive(Clone, Copy, Debug)]
pub struct AlertTrackerConfig {
    /// How many state transitions within the window mark the monitor as flapping
    pub flap_transition_threshold: usize,
    /// Time window for flapping detection
    pub flap_window: Duration,
    /// Consecutive successes required to consider an incident recovered
    pub recovery_success_threshold: u16,
}

impl Default for AlertTrackerConfig {
    fn default() -> Self {
        Self {
            // Flapping: 4 transitions in 10 minutes
            flap_transition_threshold: 4,
            flap_window: Duration::minutes(10),
            // One healthy check is enough to call it recovered (existing behavior)
            recovery_success_threshold: 1,
        }
    }
}

/// Incident lifecycle events emitted by the evaluator
#[derive(Clone, Debug)]
pub enum IncidentEvent {
    /// A new incident opened (possibly immediately marked flapping)
    Opened {
        incident_id: Uuid,
        is_flapping: bool,
    },
    /// Ongoing incident got another failing signal (maybe flapping)
    Updated {
        incident_id: Uuid,
        is_flapping: bool,
    },
    /// First transition into flapping mode for this incident
    Flapping {
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
        days_left: i32,
    },
    Expired {
        incident_id: Uuid,
        days_left: i32,
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

        Self::track_transition(state, status, now, self.config);
        state.last_status = Some(status);

        // Not past the alerting threshold yet
        if consecutive_failures < failure_threshold as u16 {
            state.consecutive_failures = consecutive_failures;
            return None;
        }

        let was_flapping = matches!(state.state, IncidentState::Flapping);
        let was_open = matches!(state.state, IncidentState::Open | IncidentState::Flapping);
        let is_flapping = Self::is_flapping(state, now, self.config);

        // Start or continue an incident
        if state.incident_id.is_none() {
            state.incident_id = Some(Uuid::new_v4());
        }

        state.state = if is_flapping {
            IncidentState::Flapping
        } else {
            IncidentState::Open
        };
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

        // Emit a dedicated flapping event on the first transition into flapping
        if is_flapping && !was_flapping {
            return Some(IncidentEvent::Flapping { incident_id });
        }

        if was_open {
            Some(IncidentEvent::Updated {
                incident_id,
                is_flapping,
            })
        } else {
            Some(IncidentEvent::Opened {
                incident_id,
                is_flapping,
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

        Self::track_transition(state, status, now, self.config);
        state.last_status = Some(status);

        let has_open_incident = matches!(
            state.state,
            IncidentState::Open | IncidentState::Flapping
        ) && state.is_down;

        if !has_open_incident {
            state.consecutive_successes = state.consecutive_successes.saturating_add(1);
            return None;
        }

        // Require a configurable number of successes before recovery
        state.consecutive_successes = state.consecutive_successes.saturating_add(1);
        if state.consecutive_successes < self.config.recovery_success_threshold {
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

        Some(IncidentEvent::Resolved {
            incident_id,
            downtime_duration,
        })
    }

    /// Check if an SSL expiry alert should be sent
    pub async fn should_alert_ssl_expiry(
        &self,
        check_id: &str,
        days_left: i32,
        alert_threshold_days: i32,
    ) -> Option<SslEvent> {
        if days_left > alert_threshold_days {
            return None;
        }

        let mut states = self.states.write().await;

        let should_alert = match states.get(check_id) {
            Some(state) => {
                // Alert if days_left decreased significantly (crossed threshold)
                state
                    .last_ssl_days_left
                    .map(|last| days_left < last && (last - days_left) >= 7)
                    .unwrap_or(true)
            }
            None => true,
        };

        if should_alert {
            if let Some(state) = states.get_mut(check_id) {
                state.last_ssl_days_left = Some(days_left);
            }

            let incident_id = Uuid::new_v4();
            if days_left <= 0 {
                Some(SslEvent::Expired { incident_id, days_left })
            } else {
                Some(SslEvent::Expiring { incident_id, days_left })
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
            state.is_down = matches!(seed.state, IncidentState::Open | IncidentState::Flapping);
            state.down_since = Some(seed.started_at);
            state.consecutive_failures = seed.failure_count;
            state.consecutive_successes = 0;
            warm_count += 1;
        }

        info!(
            down_monitors = warm_count,
            "Alert tracker warmed from incident snapshots"
        );
    }

    fn track_transition(
        state: &mut MonitorAlertState,
        status: MonitorStatus,
        now: DateTime<Utc>,
        config: AlertTrackerConfig,
    ) {
        if let Some(last_status) = state.last_status {
            if last_status == status {
                return;
            }
        }

        state.transitions.push_back(now);

        while let Some(front) = state.transitions.front() {
            if now.signed_duration_since(*front) > config.flap_window {
                state.transitions.pop_front();
            } else {
                break;
            }
        }
    }

    fn is_flapping(
        state: &mut MonitorAlertState,
        now: DateTime<Utc>,
        config: AlertTrackerConfig,
    ) -> bool {
        // Trim old transitions first (defensive)
        while let Some(front) = state.transitions.front() {
            if now.signed_duration_since(*front) > config.flap_window {
                state.transitions.pop_front();
            } else {
                break;
            }
        }

        let was_flapping = matches!(state.state, IncidentState::Flapping);
        let is_flapping = state.transitions.len() >= config.flap_transition_threshold;

        if is_flapping && !was_flapping {
            state.flap_count = state.flap_count.saturating_add(1);
        }

        is_flapping
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
        })
    }
}
