//! Alert service - orchestrates alert detection and delivery
//!
//! This is the main entry point for the alerting system. It coordinates:
//! - State tracking to prevent duplicate alerts
//! - Email delivery
//! - Alert history recording
//!
//! Alert configuration is embedded in MonitorCheck, so no separate config cache is needed.

use std::collections::HashSet;
use std::sync::Arc;
use tracing::{debug, error, info, warn};

use super::email::{EmailService, EmailServiceConfig};
use super::history::{AlertHistoryRecord, AlertHistoryWriter};
use super::tracker::{AlertTracker, AlertTrackerConfig, AlertType};
use crate::monitor::{MonitorCheck, MonitorStatus, ProbeOutcome};

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
}

impl Default for AlertServiceConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            tracker_config: AlertTrackerConfig::default(),
            email_config: EmailServiceConfig::from_env(),
        }
    }
}

/// The main alert service that coordinates all alerting functionality
pub struct AlertService {
    tracker: AlertTracker,
    email_service: Option<EmailService>,
    history_writer: Option<AlertHistoryWriter>,
    enabled: bool,
}

impl AlertService {
    pub async fn new(config: AlertServiceConfig, history_writer: Option<AlertHistoryWriter>) -> Self {
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

        // Warm the tracker from alert history to prevent re-alerting on restart
        if let Some(ref writer) = history_writer {
            match writer.fetch_latest_alert_states().await {
                Ok(states) => {
                    tracker.warm_from_history(states).await;
                }
                Err(e) => {
                    error!(error = ?e, "Failed to warm alert tracker from history");
                    warn!("Alert tracker starting cold - may re-send alerts for monitors that were already down");
                }
            }
        }

        Self {
            tracker,
            email_service,
            history_writer,
            enabled: config.enabled,
        }
    }

    /// Process a probe outcome and send alerts if needed
    ///
    /// This is the main entry point called after each probe completes.
    pub async fn process_probe_outcome(&self, ctx: &AlertContext) {
        if !self.enabled {
            return;
        }

        let alert_config = &ctx.check.alert;

        if !alert_config.enabled {
            return;
        }

        // Check for different alert conditions
        match ctx.status {
            MonitorStatus::Down | MonitorStatus::Error => self.handle_failure_alert(ctx).await,
            MonitorStatus::Ok => self.handle_success(ctx).await,
            MonitorStatus::Warn => {
                // Check for SSL warnings
                if let Some(days_left) = ctx.tls_days_left {
                    self.handle_ssl_alert(ctx, days_left).await;
                }
            }
        }
    }

    /// Process a TLS probe outcome specifically for SSL alerts
    pub async fn process_tls_probe_outcome(&self, ctx: &AlertContext) {
        if !self.enabled {
            return;
        }

        let alert_config = &ctx.check.alert;

        if !alert_config.enabled || !alert_config.on_ssl_expiry {
            return;
        }

        if let Some(days_left) = ctx.tls_days_left {
            self.handle_ssl_alert(ctx, days_left).await;
        }
    }

    async fn handle_failure_alert(&self, ctx: &AlertContext) {
        let alert_config = &ctx.check.alert;

        if !alert_config.on_down {
            return;
        }

        let decision = self
            .tracker
            .should_alert_down(
                &ctx.check.id,
                ctx.consecutive_failures,
                alert_config.failure_threshold,
            )
            .await;

        if !decision.should_alert {
            // Update failure count but don't alert
            self.tracker
                .update_failure_count(&ctx.check.id, ctx.consecutive_failures)
                .await;
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!(
                check_id = %ctx.check.id,
                "No recipients configured for down alert"
            );
            self.tracker.record_down_alert(&ctx.check.id).await;
            return;
        }

        let result = self.send_down_alert(ctx, recipients).await;

        if result {
            self.tracker.record_down_alert(&ctx.check.id).await;
            
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
                "Down alert sent"
            );
        }
    }

    async fn handle_success(&self, ctx: &AlertContext) {
        let alert_config = &ctx.check.alert;

        // Check if we need to send a recovery alert
        let decision = self.tracker.should_alert_recovery(&ctx.check.id).await;

        if !decision.should_alert {
            // Mark as recovered without alerting (wasn't down long enough)
            self.tracker.mark_recovered(&ctx.check.id).await;
            return;
        }

        if !alert_config.on_recovery {
            self.tracker.record_recovery_alert(&ctx.check.id).await;
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            self.tracker.record_recovery_alert(&ctx.check.id).await;
            return;
        }

        let result = self
            .send_recovery_alert(ctx, recipients, decision.downtime_duration)
            .await;

        if result {
            self.tracker.record_recovery_alert(&ctx.check.id).await;
            
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
                downtime = ?decision.downtime_duration,
                "Recovery alert sent"
            );
        }
    }

    async fn handle_ssl_alert(&self, ctx: &AlertContext, days_left: i32) {
        let alert_config = &ctx.check.alert;

        if !alert_config.on_ssl_expiry {
            return;
        }

        let decision = self
            .tracker
            .should_alert_ssl_expiry(&ctx.check.id, days_left, alert_config.ssl_expiry_days)
            .await;

        if !decision.should_alert {
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            self.tracker
                .record_ssl_alert(&ctx.check.id, days_left)
                .await;
            return;
        }

        let result = self.send_ssl_alert(ctx, recipients, days_left).await;

        if result {
            self.tracker
                .record_ssl_alert(&ctx.check.id, days_left)
                .await;
            
            self.record_alert_history(AlertHistoryRecord {
                monitor_check_id: ctx.check.id.clone(),
                alert_type: decision.alert_type,
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
}
