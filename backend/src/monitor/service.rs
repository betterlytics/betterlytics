//! Incident orchestrator - coordinates incident evaluation, notifications, and history
//!
//! This is the main entry point for the monitoring incident system. It coordinates:
//! - Using `IncidentEvaluator` to maintain per-monitor incident state and derive events
//! - Using `NotificationTracker` for notification deduping and cooldowns
//! - Email delivery (when configured)
//! - Alert history recording and persistence of incident snapshots
//!
//! Alert configuration is embedded in `MonitorCheck`, so no separate config cache is needed.

use std::collections::HashSet;
use std::sync::Arc;

use chrono::Duration;
use tracing::{debug, error, info, warn};

use super::alert::email as email_templates;
use super::alert::repository::{AlertHistoryRecord, AlertHistoryWriter};
use super::alert::NotificationTracker;
use crate::config::EmailConfig;
use crate::email::EmailService;
use crate::monitor::incident::{
    IncidentEvaluator, IncidentEvaluatorConfig, IncidentEvent, IncidentStore,
    MonitorIncidentRow,
};
use crate::monitor::{IncidentType, MonitorCheck, MonitorStatus, ProbeOutcome, ReasonCode};

/// Context for processing an incident
#[derive(Clone, Debug)]
pub struct IncidentContext {
    pub check: Arc<MonitorCheck>,
    pub consecutive_failures: u16,
    pub status: MonitorStatus,
    pub status_code: Option<u16>,
    pub reason_code: ReasonCode,
    pub tls_days_left: Option<i32>,
    pub tls_not_after: Option<chrono::DateTime<chrono::Utc>>,
}

impl IncidentContext {
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
            reason_code: outcome.reason_code,
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

/// Configuration for the incident orchestrator
#[derive(Clone, Debug)]
pub struct IncidentOrchestratorConfig {
    pub enabled: bool,
    pub evaluator_config: IncidentEvaluatorConfig,
    pub email_config: Option<EmailConfig>,
    pub public_base_url: String,
    pub ssl_cooldown: Duration,
}

impl IncidentOrchestratorConfig {
    pub fn from_config(config: &crate::config::Config) -> Self {
        Self {
            enabled: true,
            evaluator_config: IncidentEvaluatorConfig::default(),
            email_config: config.email.clone(),
            public_base_url: config.public_base_url.clone(),
            ssl_cooldown: Duration::hours(24),
        }
    }
}

/// The main orchestrator that coordinates incident evaluation, notifications, and persistence
pub struct IncidentOrchestrator {
    evaluator: IncidentEvaluator,
    notification_tracker: Arc<NotificationTracker>,
    email_service: Option<EmailService>,
    history_writer: Option<Arc<AlertHistoryWriter>>,
    enabled: bool,
    incident_store: Option<Arc<IncidentStore>>,
    public_base_url: String,
}

impl IncidentOrchestrator {
    pub async fn new(
        config: IncidentOrchestratorConfig,
        history_writer: Option<Arc<AlertHistoryWriter>>,
        incident_store: Option<Arc<IncidentStore>>,
    ) -> Self {
        let email_service = config.email_config.map(EmailService::new);

        if email_service.is_none() {
            warn!("Email service not configured - alerts will be logged but not sent");
        } else {
            info!("Incident orchestrator initialized with email delivery");
        }

        if history_writer.is_none() {
            warn!("Alert history writer not configured - alerts will not be recorded");
        }

        let evaluator = IncidentEvaluator::new(config.evaluator_config);
        let notification_tracker = NotificationTracker::new(config.ssl_cooldown);

        if let Some(store_ref) = incident_store.as_ref() {
            match store_ref.load_active_incidents().await {
                Ok(seeds) => {
                    evaluator.warm_from_incidents(&seeds);
                    notification_tracker.warm_from_incidents(&seeds);
                }
                Err(err) => {
                    error!(error = ?err, "Failed to warm incident state from persisted incidents");
                    warn!(
                        "Incident orchestrator starting cold - may re-send alerts for monitors that were already down"
                    );
                }
            }
        }

        Self {
            evaluator,
            notification_tracker,
            email_service,
            history_writer,
            enabled: config.enabled,
            incident_store,
            public_base_url: config.public_base_url,
        }
    }

    /// Process a probe outcome and send alerts if needed
    ///
    /// This is the main entry point called after each probe completes.
    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, status = ?ctx.status)
    )]
    pub async fn process_probe_outcome(&self, ctx: &IncidentContext) {
        if !self.enabled {
            debug!("incident orchestrator globally disabled; skipping probe outcome");
            return;
        }

        let alert_config = &ctx.check.alert;

        if !alert_config.enabled {
            debug!("alerts disabled for this monitor; skipping probe outcome");
            return;
        }

        match ctx.status {
            MonitorStatus::Down | MonitorStatus::Error => self.handle_failure(ctx).await,
            MonitorStatus::Ok => self.handle_success(ctx).await,
            MonitorStatus::Warn => {} // TODO: Handle Warn for slow responses etc?
        }
    }

    /// Process a TLS probe outcome specifically for SSL alerts
    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, tls_days_left = ?ctx.tls_days_left)
    )]
    pub async fn process_tls_probe_outcome(&self, ctx: &IncidentContext) {
        if !self.enabled {
            return;
        }

        let alert_config = &ctx.check.alert;

        if !alert_config.enabled || !alert_config.on_ssl_expiry {
            debug!("SSL alerts disabled for monitor");
            return;
        }

        if let Some(days_left) = ctx.tls_days_left {
            self.handle_ssl_alert(ctx, days_left).await;
        }
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, site_id = %ctx.check.site_id)
    )]
    async fn handle_failure(&self, ctx: &IncidentContext) {
        let alert_config = &ctx.check.alert;

        if !alert_config.on_down {
            debug!("down alerts disabled for monitor");
            return;
        }

        // Update evaluator with latest error details
        self.evaluator
            .update_error_metadata(&ctx.check.id, ctx.reason_code, ctx.status_code);

        let event = self.evaluator.evaluate_failure(
            &ctx.check.id,
            ctx.status,
            ctx.consecutive_failures,
            alert_config.failure_threshold,
        );

        if event.is_none() {
            debug!(
                consecutive_failures = ctx.consecutive_failures,
                threshold = alert_config.failure_threshold,
                "likely below failure threshold"
            );
        }

        let incident_id = match event {
            Some(IncidentEvent::Opened { incident_id })
            | Some(IncidentEvent::Updated { incident_id }) => {
                debug!(incident_id = %incident_id, "incident opened/updated");
                incident_id
            }
            Some(IncidentEvent::Resolved { .. }) => {
                warn!("unexpected Resolved event on failure path");
                return;
            }
            None => return,
        };

        if !self
            .notification_tracker
            .should_notify_down(&ctx.check.id, incident_id)
        {
            self.persist_incident_snapshot(ctx).await;
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!("no recipients configured");
            self.notification_tracker
                .mark_notified_down(&ctx.check.id, incident_id);
            self.persist_incident_snapshot(ctx).await;
            return;
        }

        let result = self.send_down_alert(ctx, recipients).await;

        if result {
            self.notification_tracker
                .mark_notified_down(&ctx.check.id, incident_id);

            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                site_id: ctx.check.site_id.clone(),
                alert_type: IncidentType::Down,
                sent_to: recipients.clone(),
                status_code: ctx.status_code.map(|c| c as i32),
                latency_ms: None,
                ssl_days_left: None,
            });

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = recipients.len(),
                incident_id = %incident_id,
                "Down alert sent"
            );
        }

        self.persist_incident_snapshot(ctx).await;
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, site_id = %ctx.check.site_id)
    )]
    async fn handle_success(&self, ctx: &IncidentContext) {
        let alert_config = &ctx.check.alert;

        let event = self.evaluator.evaluate_recovery(&ctx.check.id, ctx.status);

        if !matches!(event, Some(IncidentEvent::Resolved { .. })) {
            debug!("incident still open");
        }

        let (incident_id, downtime_duration) = match event {
            Some(IncidentEvent::Resolved {
                incident_id,
                downtime_duration,
            }) => (incident_id, downtime_duration),
            _ => return,
        };

        if !alert_config.on_recovery {
            debug!("recovery alerts disabled for monitor");
            self.notification_tracker
                .mark_notified_recovery(&ctx.check.id, incident_id);
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!("no recipients configured");
            self.notification_tracker
                .mark_notified_recovery(&ctx.check.id, incident_id);
            self.persist_incident_snapshot(ctx).await;
            return;
        }

        let result = self
            .send_recovery_alert(ctx, recipients, downtime_duration)
            .await;

        if result {
            self.notification_tracker
                .mark_notified_recovery(&ctx.check.id, incident_id);

            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                site_id: ctx.check.site_id.clone(),
                alert_type: IncidentType::Recovery,
                sent_to: recipients.clone(),
                status_code: None,
                latency_ms: None,
                ssl_days_left: None,
            });

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = recipients.len(),
                downtime = ?downtime_duration,
                incident_id = %incident_id,
                "Recovery alert sent"
            );
        }

        self.persist_incident_snapshot(ctx).await;
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, days_left = days_left)
    )]
    async fn handle_ssl_alert(&self, ctx: &IncidentContext, days_left: i32) {
        let alert_config = &ctx.check.alert;

        if !alert_config.on_ssl_expiry {
            debug!("SSL alerts disabled for monitor");
            return;
        }

        // Check both threshold and cooldown via NotificationTracker
        if !self.notification_tracker.should_notify_ssl(
            &ctx.check.id,
            days_left,
            alert_config.ssl_expiry_days,
        ) {
            debug!(
                threshold = alert_config.ssl_expiry_days,
                "SSL notification not needed (above threshold or cooldown active)"
            );
            return;
        }

        // Map days_left to incident type
        let alert_type = if days_left <= 0 {
            IncidentType::SslExpired
        } else {
            IncidentType::SslExpiring
        };

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!("no recipients configured");
            self.notification_tracker.mark_notified_ssl(&ctx.check.id);
            return;
        }

        let result = self.send_ssl_alert(ctx, recipients, days_left).await;

        if result {
            self.notification_tracker.mark_notified_ssl(&ctx.check.id);

            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                site_id: ctx.check.site_id.clone(),
                alert_type,
                sent_to: recipients.clone(),
                status_code: None,
                latency_ms: None,
                ssl_days_left: Some(days_left),
            });

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                days_left = days_left,
                recipients = recipients.len(),
                "SSL alert sent"
            );
        }
    }

    #[tracing::instrument(level = "debug", skip(self, ctx, recipients), fields(check_id = %ctx.check.id))]
    async fn send_down_alert(&self, ctx: &IncidentContext, recipients: &[String]) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                recipients = recipients.len(),
                "Would send down alert (email service not configured)"
            );
            return false;
        };

        let request = email_templates::build_down_alert(
            recipients,
            &ctx.monitor_name(),
            ctx.check.url.as_str(),
            ctx.reason_code,
            ctx.status_code,
            &self.public_base_url,
            &ctx.check.dashboard_id,
            &ctx.check.id,
        );

        match email_service.send(request).await {
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

    #[tracing::instrument(level = "debug", skip(self, ctx, recipients), fields(check_id = %ctx.check.id))]
    async fn send_recovery_alert(
        &self,
        ctx: &IncidentContext,
        recipients: &[String],
        downtime: Option<chrono::Duration>,
    ) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                recipients = recipients.len(),
                "Would send recovery alert (email service not configured)"
            );
            return false;
        };

        let request = email_templates::build_recovery_alert(
            recipients,
            &ctx.monitor_name(),
            ctx.check.url.as_str(),
            downtime,
            &self.public_base_url,
            &ctx.check.dashboard_id,
            &ctx.check.id,
        );

        match email_service.send(request).await {
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

    #[tracing::instrument(level = "debug", skip(self, ctx, recipients), fields(check_id = %ctx.check.id, days_left = days_left))]
    async fn send_ssl_alert(
        &self,
        ctx: &IncidentContext,
        recipients: &[String],
        days_left: i32,
    ) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                recipients = recipients.len(),
                "Would send SSL alert (email service not configured)"
            );
            return false;
        };

        let request = email_templates::build_ssl_alert(
            recipients,
            &ctx.monitor_name(),
            ctx.check.url.as_str(),
            days_left,
            ctx.tls_not_after,
            &self.public_base_url,
            &ctx.check.dashboard_id,
            &ctx.check.id,
        );

        match email_service.send(request).await {
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

    /// Prune inactive monitors from the evaluator and notification state
    pub async fn prune_inactive(&self, active_ids: &HashSet<String>) {
        self.evaluator.prune_inactive(active_ids);
        self.notification_tracker.prune_inactive(active_ids);
    }

    /// Record an alert to the history table
    fn record_alert_history(&self, record: AlertHistoryRecord) {
        if let Some(ref writer) = self.history_writer {
            let row = record.to_row();
            if let Err(e) = writer.enqueue_rows(vec![row]) {
                error!(
                    monitor_check_id = %record.monitor_check_id,
                    alert_type = ?record.alert_type,
                    error = ?e,
                    "Failed to record alert history"
                );
            }
        }
    }

    async fn persist_incident_snapshot(&self, ctx: &IncidentContext) {
        let Some(store) = &self.incident_store else {
            return;
        };

        let Some(snapshot) = self.evaluator.snapshot(&ctx.check.id) else {
            return;
        };

        let notified = self.notification_tracker.snapshot(&ctx.check.id);

        let Some(row) = MonitorIncidentRow::from_snapshot(&snapshot, &ctx.check, notified) else {
            debug!("no incident_id - skipping persist");
            return;
        };

        if let Err(err) = store.enqueue_rows(vec![row]) {
            warn!(error = ?err, "Failed to enqueue incident snapshot");
        }
    }
}
