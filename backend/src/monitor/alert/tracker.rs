use chrono::{DateTime, Duration, Utc};
use std::collections::HashMap;
use tokio::sync::RwLock;
use tracing::info;

use super::history::LatestAlertState;

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

#[derive(Clone, Debug)]
struct MonitorAlertState {
    /// Whether the monitor is currently considered down
    is_down: bool,
    /// Timestamp when the monitor went down
    down_since: Option<DateTime<Utc>>,
    /// Last time a down alert was sent
    last_down_alert: Option<DateTime<Utc>>,
    /// Last time a recovery alert was sent
    last_recovery_alert: Option<DateTime<Utc>>,
    /// Last time an SSL expiry alert was sent
    last_ssl_alert: Option<DateTime<Utc>>,
    /// Last known SSL days left (to avoid repeated alerts)
    last_ssl_days_left: Option<i32>,
    /// Count of consecutive failures
    consecutive_failures: u16,
}

impl Default for MonitorAlertState {
    fn default() -> Self {
        Self {
            is_down: false,
            down_since: None,
            last_down_alert: None,
            last_recovery_alert: None,
            last_ssl_alert: None,
            last_ssl_days_left: None,
            consecutive_failures: 0,
        }
    }
}

/// Configuration for the alert tracker
#[derive(Clone, Copy, Debug)]
pub struct AlertTrackerConfig {
    /// Minimum time between repeated down alerts for the same monitor
    pub down_alert_cooldown: Duration,
    /// Minimum time between SSL expiry alerts
    pub ssl_alert_cooldown: Duration,
}

impl Default for AlertTrackerConfig {
    fn default() -> Self {
        Self {
            // Don't send repeated down alerts more than once per hour
            down_alert_cooldown: Duration::hours(1),
            // Don't send SSL alerts more than once per day
            ssl_alert_cooldown: Duration::hours(24),
        }
    }
}

/// Decision about whether to send an alert
#[derive(Clone, Debug)]
pub struct AlertDecision {
    pub should_alert: bool,
    pub alert_type: AlertType,
    pub downtime_duration: Option<Duration>,
}

/// Tracks alert state for all monitors
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

    /// Check if a down alert should be sent
    ///
    /// Returns true if:
    /// - The monitor wasn't already marked as down, OR
    /// - The cooldown period has passed since the last down alert
    pub async fn should_alert_down(
        &self,
        check_id: &str,
        consecutive_failures: u16,
        failure_threshold: i32,
    ) -> AlertDecision {
        if consecutive_failures < failure_threshold as u16 {
            return AlertDecision {
                should_alert: false,
                alert_type: AlertType::Down,
                downtime_duration: None,
            };
        }

        let states = self.states.read().await;
        let now = Utc::now();

        let should_alert = match states.get(check_id) {
            Some(state) => {
                if !state.is_down {
                    // First time going down
                    true
                } else {
                    // Already down - check cooldown
                    state
                        .last_down_alert
                        .map(|t| now.signed_duration_since(t) > self.config.down_alert_cooldown)
                        .unwrap_or(true)
                }
            }
            None => true, // No state yet, first failure
        };

        AlertDecision {
            should_alert,
            alert_type: AlertType::Down,
            downtime_duration: None,
        }
    }

    /// Check if a recovery alert should be sent
    ///
    /// Returns true if the monitor was previously marked as down
    pub async fn should_alert_recovery(&self, check_id: &str) -> AlertDecision {
        let states = self.states.read().await;
        let now = Utc::now();

        let (should_alert, downtime_duration) = match states.get(check_id) {
            Some(state) if state.is_down => {
                let duration = state.down_since.map(|t| now.signed_duration_since(t));
                (true, duration)
            }
            _ => (false, None),
        };

        AlertDecision {
            should_alert,
            alert_type: AlertType::Recovery,
            downtime_duration,
        }
    }

    /// Check if an SSL expiry alert should be sent
    pub async fn should_alert_ssl_expiry(
        &self,
        check_id: &str,
        days_left: i32,
        alert_threshold_days: i32,
    ) -> AlertDecision {
        if days_left > alert_threshold_days {
            return AlertDecision {
                should_alert: false,
                alert_type: AlertType::SslExpiring,
                downtime_duration: None,
            };
        }

        let alert_type = if days_left <= 0 {
            AlertType::SslExpired
        } else {
            AlertType::SslExpiring
        };

        let states = self.states.read().await;
        let now = Utc::now();

        let should_alert = match states.get(check_id) {
            Some(state) => {
                // Check cooldown
                let cooldown_passed = state
                    .last_ssl_alert
                    .map(|t| now.signed_duration_since(t) > self.config.ssl_alert_cooldown)
                    .unwrap_or(true);

                // Also alert if days_left decreased significantly (e.g., crossed a threshold)
                let days_decreased = state
                    .last_ssl_days_left
                    .map(|last| days_left < last && (last - days_left) >= 7)
                    .unwrap_or(true);

                cooldown_passed || days_decreased
            }
            None => true,
        };

        AlertDecision {
            should_alert,
            alert_type,
            downtime_duration: None,
        }
    }

    /// Record that a down alert was sent
    pub async fn record_down_alert(&self, check_id: &str) {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        state.is_down = true;
        state.last_down_alert = Some(now);
        if state.down_since.is_none() {
            state.down_since = Some(now);
        }
    }

    /// Record that a recovery alert was sent
    pub async fn record_recovery_alert(&self, check_id: &str) {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();

        state.is_down = false;
        state.down_since = None;
        state.last_recovery_alert = Some(Utc::now());
        state.consecutive_failures = 0;
    }

    /// Record that an SSL alert was sent
    pub async fn record_ssl_alert(&self, check_id: &str, days_left: i32) {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();

        state.last_ssl_alert = Some(Utc::now());
        state.last_ssl_days_left = Some(days_left);
    }

    /// Update the failure count for a monitor (call after each probe)
    pub async fn update_failure_count(&self, check_id: &str, consecutive_failures: u16) {
        let mut states = self.states.write().await;
        let state = states.entry(check_id.to_string()).or_default();
        state.consecutive_failures = consecutive_failures;
    }

    /// Mark a monitor as recovered without sending an alert
    /// (used when the monitor recovers before threshold was reached)
    pub async fn mark_recovered(&self, check_id: &str) {
        let mut states = self.states.write().await;
        if let Some(state) = states.get_mut(check_id) {
            if !state.is_down {
                // Reset failure count if not marked as down
                state.consecutive_failures = 0;
            }
        }
    }

    /// Remove state for monitors that no longer exist
    pub async fn prune_inactive(&self, active_ids: &std::collections::HashSet<String>) {
        let mut states = self.states.write().await;
        states.retain(|id, _| active_ids.contains(id));
    }

    /// Warm the tracker from historical alert data
    /// 
    /// This should be called on startup to restore state from the database,
    /// preventing re-alerting for monitors that were already down before restart.
    pub async fn warm_from_history(&self, latest_states: HashMap<String, LatestAlertState>) {
        let mut states = self.states.write().await;
        let mut down_count = 0;
        let mut ssl_count = 0;

        for (monitor_id, latest) in latest_states {
            match latest.last_alert_type {
                AlertType::Down => {
                    // Monitor was last alerted as down - mark it as down
                    // so we don't re-alert until it recovers
                    let state = states.entry(monitor_id).or_default();
                    state.is_down = true;
                    state.down_since = Some(latest.last_alert_at);
                    state.last_down_alert = Some(latest.last_alert_at);
                    down_count += 1;
                }
                AlertType::Recovery => {
                    // Monitor recovered - no special state needed
                    // (default state is "not down")
                }
                AlertType::SslExpiring | AlertType::SslExpired => {
                    // Restore SSL alert state to respect cooldowns
                    let state = states.entry(monitor_id).or_default();
                    state.last_ssl_alert = Some(latest.last_alert_at);
                    state.last_ssl_days_left = latest.ssl_days_left;
                    ssl_count += 1;
                }
            }
        }

        info!(
            down_monitors = down_count,
            ssl_alerted = ssl_count,
            "Alert tracker warmed from history"
        );
    }
}
