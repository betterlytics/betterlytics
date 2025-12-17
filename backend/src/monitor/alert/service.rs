//! Alert service - orchestrates incident evaluation, notifications, and history
//!
//! This is the main entry point for the alerting system. It coordinates:
//! - Using `AlertTracker` to maintain per-monitor incident state and derive events
//! - Per-recipient notification deduping and cooldowns
//! - Email delivery (when configured)
//! - Alert history recording and persistence of incident snapshots
//!
//! Alert configuration is embedded in `MonitorCheck`, so no separate config cache is needed.

use std::collections::HashSet;
use std::sync::Arc;
use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use super::email::{EmailService, EmailServiceConfig};
use super::history::{AlertHistoryRecord, AlertHistoryWriter};
use super::tracker::{AlertTracker, AlertTrackerConfig, AlertType, IncidentEvent, SslEvent};
use crate::monitor::{
    IncidentStore, MonitorCheck, MonitorIncidentRow, MonitorStatus, ProbeOutcome,
};
use crate::monitor::incident_store::{IncidentSeed, NotificationSnapshot};
use serde_json::json;

/// Context for processing an alert
#[derive(Clone, Debug)]
pub struct AlertContext {
    pub check: Arc<MonitorCheck>,
    pub consecutive_failures: u16,
    pub status: MonitorStatus,
    pub status_code: Option<u16>,
    pub error_message: Option<String>,
    pub tls_days_left: Option<i32>,
    pub tls_not_after: Option<chrono::DateTime<chrono::Utc>>,
}

impl AlertContext {
    pub fn from_probe(
        check: &Arc<MonitorCheck>,
        outcome: &ProbeOutcome,
        consecutive_failures: u16,
    ) -> Self {
        Self {
            check: Arc::clone(check),
            consecutive_failures,
            status: outcome.status,
            status_code: outcome.status_code,
            error_message: outcome.error.clone(),
            tls_days_left: outcome.tls_days_left,
            tls_not_after: outcome.tls_not_after,
        }
    }

    /// Get display name for the monitor
    pub fn monitor_name(&self) -> String {
        self.check
            .name
            .clone()
            .unwrap_or_else(|| self.check.url.to_string())
    }
}


/// Configuration for the alert service
#[derive(Clone, Debug)]
pub struct AlertServiceConfig {
    pub enabled: bool,
    pub tracker_config: AlertTrackerConfig,
    pub email_config: Option<EmailServiceConfig>,
    pub ssl_cooldown: Duration,
}

impl Default for AlertServiceConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            tracker_config: AlertTrackerConfig::default(),
            email_config: EmailServiceConfig::from_env(),
            ssl_cooldown: Duration::hours(24),
        }
    }
}

#[derive(Clone, Debug, Default)]
struct NotificationTimestamps {
    last_down: Option<DateTime<Utc>>,
    last_down_incident: Option<Uuid>,
    last_down_seeded: bool,
    last_recovery: Option<DateTime<Utc>>,
    last_recovery_incident: Option<Uuid>,
    last_flap: Option<DateTime<Utc>>,
    last_flap_incident: Option<Uuid>,
    last_flap_seeded: bool,
    last_ssl: Option<DateTime<Utc>>,
}

/// The main alert service that coordinates all alerting functionality
pub struct AlertService {
    tracker: AlertTracker,
    email_service: Option<EmailService>,
    history_writer: Option<AlertHistoryWriter>,
    enabled: bool,
    notification_state: DashMap<String, NotificationTimestamps>,
    ssl_cooldown: Duration,
    incident_store: Option<Arc<IncidentStore>>,
}

impl AlertService {
    pub async fn new(
        config: AlertServiceConfig,
        history_writer: Option<AlertHistoryWriter>,
        incident_store: Option<Arc<IncidentStore>>,
    ) -> Self {
        let email_service = config.email_config.map(EmailService::new);

        if email_service.is_none() {
            warn!("Email service not configured - alerts will be logged but not sent");
        } else {
            info!("Alert service initialized with email delivery");
        }

        if history_writer.is_none() {
            warn!("Alert history writer not configured - alerts will not be recorded");
        }

        let tracker = AlertTracker::new(config.tracker_config);

        let notification_state = DashMap::new();
        if let Some(store_ref) = incident_store.as_ref() {
            match store_ref.load_active_incidents().await {
                Ok(seeds) => {
                    tracker.warm_from_incidents(&seeds).await;
                    Self::hydrate_notification_state(&notification_state, &seeds);
                }
                Err(err) => {
                    error!(error = ?err, "Failed to warm alert tracker from incidents");
                    warn!(
                        "Alert tracker starting cold - may re-send alerts for monitors that were already down"
                    );
                }
            }
        }

        Self {
            tracker,
            email_service,
            history_writer,
            enabled: config.enabled,
            notification_state,
            ssl_cooldown: config.ssl_cooldown,
            incident_store,
        }
    }

    /// Process a probe outcome and send alerts if needed
    ///
    /// This is the main entry point called after each probe completes.
    pub async fn process_probe_outcome(&self, ctx: &AlertContext) {
        if !self.enabled {
            debug!(
                check_id = %ctx.check.id,
                status = ?ctx.status,
                "alert service globally disabled; skipping probe outcome"
            );
            return;
        }

        let alert_config = &ctx.check.alert;

        if !alert_config.enabled {
            debug!(
                check_id = %ctx.check.id,
                status = ?ctx.status,
                "alerts disabled for this monitor; skipping probe outcome"
            );
            return;
        }

        debug!(
            check_id = %ctx.check.id,
            monitor = %ctx.monitor_name(),
            status = ?ctx.status,
            consecutive_failures = ctx.consecutive_failures,
            "processing probe outcome for alerting"
        );

        // Check for different alert conditions
        match ctx.status {
            MonitorStatus::Down | MonitorStatus::Error => self.handle_failure_alert(ctx).await,
            MonitorStatus::Ok => self.handle_success(ctx).await,
            MonitorStatus::Warn => {} // TODO: Handle Warn for slow responses etc?
        }
    }

    /// Process a TLS probe outcome specifically for SSL alerts
    pub async fn process_tls_probe_outcome(&self, ctx: &AlertContext) {
        if !self.enabled {
            return;
        }

        let alert_config = &ctx.check.alert;

        if !alert_config.enabled || !alert_config.on_ssl_expiry {
            debug!(
                check_id = %ctx.check.id,
                tls_days_left = ctx.tls_days_left,
                "SSL alerts disabled for this monitor; skipping TLS probe outcome"
            );
            return;
        }

        if let Some(days_left) = ctx.tls_days_left {
            self.handle_ssl_alert(ctx, days_left).await;
        }
    }

    async fn handle_failure_alert(&self, ctx: &AlertContext) {
        let alert_config = &ctx.check.alert;

        if !alert_config.on_down {
            debug!(
                check_id = %ctx.check.id,
                consecutive_failures = ctx.consecutive_failures,
                failure_threshold = alert_config.failure_threshold,
                "down alerts disabled for this monitor; skipping"
            );
            return;
        }

        let event = self
            .tracker
            .evaluate_failure(
                &ctx.check.id,
                ctx.status,
                ctx.consecutive_failures,
                alert_config.failure_threshold,
            )
            .await;

        if event.is_none() {
            debug!(
                check_id = %ctx.check.id,
                consecutive_failures = ctx.consecutive_failures,
                failure_threshold = alert_config.failure_threshold,
                "no incident event from tracker (likely below failure threshold or stable state)"
            );
        }

        let (incident_id, is_flapping) = match event {
            Some(IncidentEvent::Opened { incident_id, is_flapping })
            | Some(IncidentEvent::Updated { incident_id, is_flapping }) => {
                debug!(
                    check_id = %ctx.check.id,
                    incident_id = %incident_id,
                    is_flapping,
                    consecutive_failures = ctx.consecutive_failures,
                    "incident is open/updated after failure evaluation"
                );
                (incident_id, is_flapping)
            }
            Some(IncidentEvent::Flapping { incident_id }) => {
                // Optional place to send a "flapping" notification; currently suppressed.
                if self.should_notify_flap(&ctx.check.id, incident_id).await {
                    self.mark_notified_flap(&ctx.check.id, incident_id).await;
                }
                debug!(
                    check_id = %ctx.check.id,
                    incident_id = %incident_id,
                    "monitor marked flapping; persisting snapshot without user notification"
                );
                self.persist_incident_snapshot(ctx, Some(self.open_reason_code(ctx)), None)
                    .await;
                return;
            }
            Some(IncidentEvent::Resolved { .. }) => {
                // Should not happen on failure path; ignore defensively.
                debug!(
                    check_id = %ctx.check.id,
                    "received unexpected Resolved incident event on failure path; ignoring"
                );
                return;
            }
            None => return,
        };

        if is_flapping && !self.should_notify_flap(&ctx.check.id, incident_id).await {
            self.persist_incident_snapshot(ctx, Some(self.open_reason_code(ctx)), None)
                .await;
            return;
        }

        if !is_flapping && !self.should_notify_down(&ctx.check.id, incident_id).await {
            self.persist_incident_snapshot(ctx, Some(self.open_reason_code(ctx)), None)
                .await;
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!(
                check_id = %ctx.check.id,
                "No recipients configured for down alert"
            );
            self.mark_notified_down(&ctx.check.id, incident_id).await;
            self.persist_incident_snapshot(ctx, Some(self.open_reason_code(ctx)), None)
                .await;
            return;
        }

        let result = self.send_down_alert(ctx, recipients).await;

        if result {
            self.mark_notified_down(&ctx.check.id, incident_id).await;
            
            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                alert_type: AlertType::Down,
                sent_to: recipients.clone(),
                status_code: ctx.status_code.map(|c| c as i32),
                error_message: ctx.error_message.clone(),
                latency_ms: None,
                ssl_days_left: None,
            }).await;

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = recipients.len(),
                incident_id = %incident_id,
                "Down alert sent"
            );
        }

        self.persist_incident_snapshot(ctx, Some(self.open_reason_code(ctx)), None)
            .await;
    }

    async fn handle_success(&self, ctx: &AlertContext) {
        let alert_config = &ctx.check.alert;

        // Check if we need to send a recovery alert
        let event = self
            .tracker
            .evaluate_recovery(&ctx.check.id, ctx.status)
            .await;

        if !matches!(event, Some(IncidentEvent::Resolved { .. })) {
            debug!(
                check_id = %ctx.check.id,
                status = ?ctx.status,
                "no recovery event from tracker yet; incident remains open"
            );
        }

        let (incident_id, downtime_duration) = match event {
            Some(IncidentEvent::Resolved { incident_id, downtime_duration }) => (incident_id, downtime_duration),
            _ => return,
        };

        if !alert_config.on_recovery {
            debug!(
                check_id = %ctx.check.id,
                incident_id = %incident_id,
                "recovery alerts disabled for this monitor; marking as notified without email"
            );
            self.mark_notified_recovery(&ctx.check.id, incident_id).await;
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!(
                check_id = %ctx.check.id,
                incident_id = %incident_id,
                "no recipients configured for recovery alert; marking as notified only"
            );
            self.mark_notified_recovery(&ctx.check.id, incident_id).await;
            self.persist_incident_snapshot(ctx, None, Some("recovered".to_string()))
                .await;
            return;
        }

        let result = self
            .send_recovery_alert(ctx, recipients, downtime_duration)
            .await;

        if result {
            self.mark_notified_recovery(&ctx.check.id, incident_id).await;
            
            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                alert_type: AlertType::Recovery,
                sent_to: recipients.clone(),
                status_code: None,
                error_message: None,
                latency_ms: None,
                ssl_days_left: None,
            }).await;

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = recipients.len(),
                downtime = ?downtime_duration,
                incident_id = %incident_id,
                "Recovery alert sent"
            );
        }

        self.persist_incident_snapshot(ctx, None, Some("recovered".to_string()))
            .await;
    }

    async fn handle_ssl_alert(&self, ctx: &AlertContext, days_left: i32) {
        let alert_config = &ctx.check.alert;

        if !alert_config.on_ssl_expiry {
            debug!(
                check_id = %ctx.check.id,
                days_left = days_left,
                "SSL expiry alerts disabled for this monitor; skipping"
            );
            return;
        }

        let event = self
            .tracker
            .should_alert_ssl_expiry(&ctx.check.id, days_left, alert_config.ssl_expiry_days)
            .await;

        if event.is_none() {
            debug!(
                check_id = %ctx.check.id,
                days_left = days_left,
                threshold_days = alert_config.ssl_expiry_days,
                "tracker decided not to emit SSL incident event (likely above threshold or insignificant change)"
            );
        }

        let (alert_type, incident_id) = match event {
            Some(SslEvent::Expired { incident_id }) => (AlertType::SslExpired, incident_id),
            Some(SslEvent::Expiring { incident_id }) => (AlertType::SslExpiring, incident_id),
            None => return,
        };

        if !self.should_notify_ssl(&ctx.check.id).await {
            debug!(
                check_id = %ctx.check.id,
                days_left = days_left,
                "SSL cooldown active; not sending SSL alert"
            );
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!(
                check_id = %ctx.check.id,
                incident_id = %incident_id,
                "no recipients configured for SSL alert; marking as notified only"
            );
            self.mark_notified_ssl(&ctx.check.id).await;
            return;
        }

        let result = self.send_ssl_alert(ctx, recipients, days_left).await;

        if result {
            self.mark_notified_ssl(&ctx.check.id).await;
            
            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                alert_type,
                sent_to: recipients.clone(),
                status_code: None,
                error_message: None,
                latency_ms: None,
                ssl_days_left: Some(days_left),
            }).await;

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                days_left = days_left,
                recipients = recipients.len(),
                incident_id = %incident_id,
                "SSL alert sent"
            );
        }
    }

    async fn send_down_alert(&self, ctx: &AlertContext, recipients: &[String]) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = ?recipients,
                "Would send down alert (email service not configured)"
            );
            return false;
        };

        match email_service
            .send_down_alert(
                recipients,
                &ctx.monitor_name(),
                ctx.check.url.as_str(),
                ctx.error_message.as_deref(),
                ctx.status_code,
                &ctx.check.dashboard_id,
                &ctx.check.id,
            )
            .await
        {
            Ok(()) => true,
            Err(e) => {
                error!(
                    check_id = %ctx.check.id,
                    error = ?e,
                    "Failed to send down alert email"
                );
                false
            }
        }
    }

    async fn send_recovery_alert(
        &self,
        ctx: &AlertContext,
        recipients: &[String],
        downtime: Option<chrono::Duration>,
    ) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = ?recipients,
                "Would send recovery alert (email service not configured)"
            );
            return false;
        };

        match email_service
            .send_recovery_alert(
                recipients,
                &ctx.monitor_name(),
                ctx.check.url.as_str(),
                downtime,
                &ctx.check.dashboard_id,
                &ctx.check.id,
            )
            .await
        {
            Ok(()) => true,
            Err(e) => {
                error!(
                    check_id = %ctx.check.id,
                    error = ?e,
                    "Failed to send recovery alert email"
                );
                false
            }
        }
    }

    async fn send_ssl_alert(&self, ctx: &AlertContext, recipients: &[String], days_left: i32) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                days_left = days_left,
                recipients = ?recipients,
                "Would send SSL alert (email service not configured)"
            );
            return false;
        };

        match email_service
            .send_ssl_alert(
                recipients,
                &ctx.monitor_name(),
                ctx.check.url.as_str(),
                days_left,
                ctx.tls_not_after,
                &ctx.check.dashboard_id,
                &ctx.check.id,
            )
            .await
        {
            Ok(()) => true,
            Err(e) => {
                error!(
                    check_id = %ctx.check.id,
                    error = ?e,
                    "Failed to send SSL alert email"
                );
                false
            }
        }
    }

    /// Prune inactive monitors from the tracker
    pub async fn prune_inactive(&self, active_ids: &HashSet<String>) {
        self.tracker.prune_inactive(active_ids).await;
    }

    /// Record an alert to the history table
    async fn record_alert_history(&self, record: AlertHistoryRecord) {
        if let Some(ref writer) = self.history_writer {
            if let Err(e) = writer.record_alert(&record).await {
                error!(
                    monitor_check_id = %record.monitor_check_id,
                    alert_type = ?record.alert_type,
                    error = ?e,
                    "Failed to record alert history"
                );
            }
        }
    }

    async fn should_notify_down(&self, check_id: &str, incident_id: Uuid) -> bool {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        if entry.last_down_incident == Some(incident_id) {
            debug!(
                check_id = check_id,
                incident_id = %incident_id,
                "not sending down alert: already notified for this incident"
            );
            return false;
        }
        if entry.last_down_seeded {
            entry.last_down_seeded = false;
            entry.last_down_incident = Some(incident_id);
            debug!(
                check_id = check_id,
                incident_id = %incident_id,
                "not sending down alert: seeded from existing incident history"
            );
            return false;
        }
        debug!(
            check_id = check_id,
            incident_id = %incident_id,
            "allowing down alert notification"
        );
        true
    }

    async fn should_notify_flap(&self, check_id: &str, incident_id: Uuid) -> bool {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        if entry.last_flap_incident == Some(incident_id) {
            debug!(
                check_id = check_id,
                incident_id = %incident_id,
                "not sending flap alert: already notified for this incident"
            );
            return false;
        }
        if entry.last_flap_seeded {
            entry.last_flap_seeded = false;
            entry.last_flap_incident = Some(incident_id);
            debug!(
                check_id = check_id,
                incident_id = %incident_id,
                "not sending flap alert: seeded from existing incident history"
            );
            return false;
        }
        debug!(
            check_id = check_id,
            incident_id = %incident_id,
            "allowing flap alert notification"
        );
        true
    }

    async fn mark_notified_flap(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        entry.last_flap = Some(Utc::now());
        entry.last_flap_incident = Some(incident_id);
        entry.last_flap_seeded = false;
    }

    async fn should_notify_ssl(&self, check_id: &str) -> bool {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        let now = Utc::now();
        let allow = entry
            .last_ssl
            .map(|t| now.signed_duration_since(t) > self.ssl_cooldown)
            .unwrap_or(true);
        if allow {
            debug!(
                check_id = check_id,
                last_ssl_at = ?entry.last_ssl,
                ssl_cooldown = ?self.ssl_cooldown,
                "allowing SSL alert notification"
            );
            entry.last_ssl = Some(now);
        } else {
            debug!(
                check_id = check_id,
                last_ssl_at = ?entry.last_ssl,
                ssl_cooldown = ?self.ssl_cooldown,
                "not sending SSL alert: cooldown not yet elapsed"
            );
        }
        allow
    }

    async fn mark_notified_down(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        entry.last_down = Some(Utc::now());
        entry.last_down_incident = Some(incident_id);
        entry.last_down_seeded = false;
    }

    async fn mark_notified_recovery(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        entry.last_recovery = Some(Utc::now());
        entry.last_recovery_incident = Some(incident_id);
    }

    async fn mark_notified_ssl(&self, check_id: &str) {
        let mut entry = self
            .notification_state
            .entry(check_id.to_string())
            .or_default();
        entry.last_ssl = Some(Utc::now());
    }

    async fn notification_snapshot(&self, check_id: &str) -> NotificationSnapshot {
        self.notification_state
            .get(check_id)
            .map(|t| NotificationSnapshot {
                last_down: t.last_down,
                last_recovery: t.last_recovery,
                last_flap: t.last_flap,
            })
            .unwrap_or_default()
    }

    async fn persist_incident_snapshot(
        &self,
        ctx: &AlertContext,
        open_reason_code: Option<String>,
        close_reason_code: Option<String>,
    ) {
        let Some(store) = &self.incident_store else {
            return;
        };

        let Some(snapshot) = self.tracker.snapshot(&ctx.check.id).await else {
            return;
        };

        let notified = self.notification_snapshot(&ctx.check.id).await;
        let extra = json!({
            "status": ctx.status.as_str(),
            "status_code": ctx.status_code,
            "error": ctx.error_message,
            "tls_days_left": ctx.tls_days_left,
            "is_flapping": matches!(snapshot.state, super::tracker::IncidentState::Flapping),
        });

        let row = MonitorIncidentRow::from_snapshot(
            &snapshot,
            &ctx.check,
            notified,
            open_reason_code,
            close_reason_code,
            extra,
        );

        if let Err(err) = store.enqueue_rows(vec![row]) {
            warn!(error = ?err, "Failed to enqueue incident snapshot");
        }
    }

    fn open_reason_code(&self, ctx: &AlertContext) -> String {
        if let Some(code) = ctx.status_code {
            return format!("status_code_{code}");
        }
        if let Some(err) = &ctx.error_message {
            return err.clone();
        }
        ctx.status.as_str().to_string()
    }

    fn hydrate_notification_state(
        state: &DashMap<String, NotificationTimestamps>,
        seeds: &[IncidentSeed],
    ) {
        for seed in seeds {
            let mut entry = state.entry(seed.check_id.clone()).or_default();

            if let Some(ts) = seed.notified_down_at {
                entry.last_down = Some(ts);
                entry.last_down_incident = Some(seed.incident_id);
                entry.last_down_seeded = true;
            }

            if let Some(ts) = seed.notified_flap_at {
                entry.last_flap = Some(ts);
                entry.last_flap_incident = Some(seed.incident_id);
                entry.last_flap_seeded = true;
            }

            if let Some(ts) = seed.notified_resolve_at {
                entry.last_recovery = Some(ts);
                entry.last_recovery_incident = Some(seed.incident_id);
            }
        }
    }
}
