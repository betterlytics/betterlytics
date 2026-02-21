use std::collections::HashSet;
use std::sync::Arc;

use chrono::Duration;
use tracing::{debug, info, warn};

use super::alert::{
    Alert, AlertContext, AlertDispatcher, AlertDispatcherConfig, AlertHistoryWriter,
    NotificationTracker,
};
use crate::config::EmailConfig;
use crate::monitor::incident::{
    IncidentEvaluator, IncidentEvaluatorConfig, IncidentEvent, IncidentStore,
    MonitorIncidentRow,
};
use crate::monitor::{MonitorCheck, MonitorStatus, ProbeOutcome, ReasonCode};
use crate::notifications::{Notification, NotificationEngine};

#[derive(Clone, Debug)]
pub struct IncidentContext {
    pub check: Arc<MonitorCheck>,
    pub consecutive_failures: u16,
    pub status: MonitorStatus,
    pub status_code: Option<u16>,
    pub reason_code: ReasonCode,
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
            tls_not_after: outcome.tls_not_after,
        }
    }

    pub fn monitor_name(&self) -> String {
        self.check
            .name
            .clone()
            .unwrap_or_else(|| self.check.url.to_string())
    }
}

#[derive(Clone, Debug)]
pub struct IncidentOrchestratorConfig {
    pub evaluator_config: IncidentEvaluatorConfig,
    pub email_config: Option<EmailConfig>,
    pub public_base_url: String,
}

impl IncidentOrchestratorConfig {
    pub fn from_config(config: &crate::config::Config) -> Self {
        Self {
            evaluator_config: IncidentEvaluatorConfig::default(),
            email_config: config.email.clone(),
            public_base_url: config.public_base_url.clone(),
        }
    }
}

pub struct IncidentOrchestrator {
    evaluator: IncidentEvaluator,
    notification_tracker: Arc<NotificationTracker>,
    dispatcher: AlertDispatcher,
    incident_store: Option<Arc<IncidentStore>>,
    notification_engine: Option<Arc<NotificationEngine>>,
    public_base_url: String,
}

impl IncidentOrchestrator {
    pub async fn new(
        config: IncidentOrchestratorConfig,
        history_writer: Option<Arc<AlertHistoryWriter>>,
        incident_store: Option<Arc<IncidentStore>>,
        notification_engine: Option<Arc<NotificationEngine>>,
    ) -> Self {
        let public_base_url = config.public_base_url.clone();

        let dispatcher = AlertDispatcher::new(
            AlertDispatcherConfig {
                email_config: config.email_config,
                public_base_url: config.public_base_url,
            },
            history_writer,
        );

        if !dispatcher.has_email_service() {
            warn!("Email service not configured - incidents will be logged without alerts");
        } else {
            info!("Incident orchestrator initialized with email delivery");
        }

        let evaluator = IncidentEvaluator::new(config.evaluator_config);
        let notification_tracker = NotificationTracker::new();

        if let Some(store_ref) = incident_store.as_ref() {
            let seeds = store_ref
                .load_active_incidents()
                .await
                .expect("Failed to load incident state from database - cannot start without incident history");

            evaluator.warm_from_incidents(&seeds);
            notification_tracker.warm_from_incidents(&seeds);
        }

        Self {
            evaluator,
            notification_tracker,
            dispatcher,
            incident_store,
            notification_engine,
            public_base_url,
        }
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, status = ?ctx.status)
    )]
    pub async fn process_probe_outcome(&self, ctx: &IncidentContext) {
        match ctx.status {
            MonitorStatus::Failed => self.handle_failure(ctx).await,
            MonitorStatus::Ok => self.handle_success(ctx).await,
            MonitorStatus::Warn => {} // TODO: Handle Warn for slow responses or other warnings
        }
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, tls_not_after = ?ctx.tls_not_after)
    )]
    pub async fn process_tls_probe_outcome(&self, ctx: &IncidentContext) {
        if let Some(not_after) = ctx.tls_not_after {
            let days_left = (not_after - chrono::Utc::now()).num_days() as i32;
            self.send_ssl_alert(ctx, days_left).await;
        }
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, site_id = %ctx.check.site_id)
    )]
    async fn handle_failure(&self, ctx: &IncidentContext) {
        let alert_config = &ctx.check.alert;

        let event = self.evaluator.evaluate_failure(
            &ctx.check.id,
            ctx.status,
            ctx.consecutive_failures,
            alert_config.failure_threshold,
            ctx.reason_code,
            ctx.status_code,
        );

        let incident_id = match event {
            Some(IncidentEvent::Opened { incident_id }) => {
                debug!(incident_id = %incident_id, "incident opened");
                incident_id
            }
            Some(IncidentEvent::Updated { incident_id }) => {
                debug!(incident_id = %incident_id, "incident updated");
                incident_id
            }
            Some(IncidentEvent::Resolved { .. }) => {
                warn!("unexpected Resolved event on failure path");
                return;
            }
            None => {
                debug!(
                    consecutive_failures = ctx.consecutive_failures,
                    threshold = alert_config.failure_threshold,
                    "below failure threshold"
                );
                return;
            }
        };

        self.persist_incident_snapshot(ctx).await;

        self.send_down_alert(ctx, incident_id).await;
    }

    async fn send_down_alert(&self, ctx: &IncidentContext, incident_id: uuid::Uuid) {
        let alert_config = &ctx.check.alert;

        if !alert_config.enabled || !alert_config.on_down {
            return;
        }

        if !self.notification_tracker.should_notify_down(&ctx.check.id, incident_id) {
            return;
        }

        let recipients = &alert_config.recipients;
        if recipients.is_empty() {
            debug!("no recipients configured - skipping notification");
            return;
        }

        let result = self
            .dispatcher
            .dispatch(
                AlertContext {
                    check_id: &ctx.check.id,
                    site_id: &ctx.check.site_id,
                    dashboard_id: &ctx.check.dashboard_id,
                    monitor_name: &ctx.monitor_name(),
                    url: ctx.check.url.as_str(),
                    recipients,
                },
                Alert::Down {
                    reason_code: ctx.reason_code,
                    status_code: ctx.status_code,
                },
            )
            .await;

        if result {
            self.notification_tracker.mark_notified_down(&ctx.check.id, incident_id);
            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = recipients.len(),
                incident_id = %incident_id,
                "Down alert sent"
            );
        }

        self.send_push_notification(
            &ctx.check.dashboard_id,
            Notification {
                title: format!("{} is down", ctx.monitor_name()),
                message: format!("{} ({}) is not responding", ctx.monitor_name(), ctx.check.url),
                url: Some(format!(
                    "{}/dashboard/{}",
                    self.public_base_url,
                    ctx.check.dashboard_id
                )),
                url_title: Some("View Dashboard".to_string()),
            },
        )
        .await;
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, site_id = %ctx.check.site_id)
    )]
    async fn handle_success(&self, ctx: &IncidentContext) {
        let event = self.evaluator.evaluate_recovery(&ctx.check.id, ctx.status);

        let (incident_id, downtime_duration) = match event {
            Some(IncidentEvent::Resolved {
                incident_id,
                downtime_duration,
            }) => {
                debug!(incident_id = %incident_id, "incident resolved");
                (incident_id, downtime_duration)
            }
            _ => {
                debug!("no active incident to resolve");
                return;
            }
        };

        self.persist_incident_snapshot(ctx).await;

        self.send_recovery_alert(ctx, incident_id, downtime_duration).await;
    }

    async fn send_recovery_alert(
        &self,
        ctx: &IncidentContext,
        incident_id: uuid::Uuid,
        downtime_duration: Option<Duration>,
    ) {
        let alert_config = &ctx.check.alert;

        if !alert_config.enabled || !alert_config.on_recovery {
            return;
        }

        let recipients = &alert_config.recipients;
        if recipients.is_empty() {
            debug!("no recipients configured - skipping notification");
            return;
        }

        let result = self
            .dispatcher
            .dispatch(
                AlertContext {
                    check_id: &ctx.check.id,
                    site_id: &ctx.check.site_id,
                    dashboard_id: &ctx.check.dashboard_id,
                    monitor_name: &ctx.monitor_name(),
                    url: ctx.check.url.as_str(),
                    recipients,
                },
                Alert::Recovery { downtime_duration },
            )
            .await;

        if result {
            self.notification_tracker.mark_notified_recovery(&ctx.check.id, incident_id);
            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                recipients = recipients.len(),
                downtime = ?downtime_duration,
                incident_id = %incident_id,
                "Recovery alert sent"
            );
        }

        let downtime_msg = downtime_duration
            .map(|d| format!(" after {}", humanize_duration(d)))
            .unwrap_or_default();

        self.send_push_notification(
            &ctx.check.dashboard_id,
            Notification {
                title: format!("{} is back up", ctx.monitor_name()),
                message: format!(
                    "{} ({}) has recovered{}",
                    ctx.monitor_name(),
                    ctx.check.url,
                    downtime_msg,
                ),
                url: Some(format!(
                    "{}/dashboard/{}",
                    self.public_base_url,
                    ctx.check.dashboard_id
                )),
                url_title: Some("View Dashboard".to_string()),
            },
        )
        .await;
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, days_left = days_left)
    )]
    async fn send_ssl_alert(&self, ctx: &IncidentContext, days_left: i32) {
        let alert_config = &ctx.check.alert;

        if !alert_config.enabled || !alert_config.on_ssl_expiry {
            debug!("SSL alerts disabled for monitor");
            return;
        }

        let expired = ctx.tls_not_after.map(|t| t <= chrono::Utc::now()).unwrap_or(false);

        if !self.notification_tracker.should_notify_ssl(
            &ctx.check.id,
            days_left,
            alert_config.ssl_expiry_days,
            expired,
            ctx.tls_not_after,
        ) {
            debug!(
                threshold = alert_config.ssl_expiry_days,
                "SSL notification not needed (above threshold or cooldown active)"
            );
            return;
        }

        let recipients = &alert_config.recipients;

        if recipients.is_empty() {
            debug!("no recipients configured - skipping notification");
            return;
        }

        let result = self
            .dispatcher
            .dispatch(
                AlertContext {
                    check_id: &ctx.check.id,
                    site_id: &ctx.check.site_id,
                    dashboard_id: &ctx.check.dashboard_id,
                    monitor_name: &ctx.monitor_name(),
                    url: ctx.check.url.as_str(),
                    recipients,
                },
                if expired {
                    Alert::SslExpired {
                        days_left,
                        expiry_date: ctx.tls_not_after,
                    }
                } else {
                    Alert::SslExpiring {
                        days_left,
                        expiry_date: ctx.tls_not_after,
                    }
                },
            )
            .await;

        if result {
            self.notification_tracker.mark_notified_ssl(&ctx.check.id, expired, ctx.tls_not_after, days_left);

            info!(
                check_id = %ctx.check.id,
                monitor = %ctx.monitor_name(),
                days_left = days_left,
                recipients = recipients.len(),
                "SSL alert sent"
            );
        }

        let (ssl_title, ssl_message) = if expired {
            (
                format!("SSL certificate expired for {}", ctx.monitor_name()),
                format!(
                    "The SSL certificate for {} ({}) has expired",
                    ctx.monitor_name(),
                    ctx.check.url,
                ),
            )
        } else {
            (
                format!("SSL certificate expiring for {}", ctx.monitor_name()),
                format!(
                    "The SSL certificate for {} ({}) expires in {} days",
                    ctx.monitor_name(),
                    ctx.check.url,
                    days_left,
                ),
            )
        };

        self.send_push_notification(
            &ctx.check.dashboard_id,
            Notification {
                title: ssl_title,
                message: ssl_message,
                url: Some(format!(
                    "{}/dashboard/{}",
                    self.public_base_url,
                    ctx.check.dashboard_id
                )),
                url_title: Some("View Dashboard".to_string()),
            },
        )
        .await;
    }

    pub async fn prune_inactive(&self, active_ids: &HashSet<String>) {
        self.evaluator.prune_inactive(active_ids);
        self.notification_tracker.prune_inactive(active_ids);
    }

    async fn send_push_notification(&self, dashboard_id: &str, notification: Notification) {
        if let Some(engine) = &self.notification_engine {
            engine.notify(dashboard_id, &notification).await;
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

fn humanize_duration(d: Duration) -> String {
    let total_secs = d.num_seconds();
    if total_secs < 60 {
        format!("{total_secs}s")
    } else if total_secs < 3600 {
        let mins = total_secs / 60;
        format!("{mins}m")
    } else {
        let hours = total_secs / 3600;
        let mins = (total_secs % 3600) / 60;
        if mins > 0 {
            format!("{hours}h {mins}m")
        } else {
            format!("{hours}h")
        }
    }
}
