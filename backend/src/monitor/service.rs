use std::collections::HashSet;
use std::sync::Arc;

use chrono::Duration;
use tracing::{debug, info, warn};

use super::alert::{
    Alert, AlertContext, AlertDispatcher, AlertHistoryWriter, NotificationTracker,
};
use super::alert::dispatcher::expiry_bucket;
use crate::jobqueue::JobQueue;
use crate::monitor::incident::{
    IncidentEvaluator, IncidentEvaluatorConfig, IncidentEvent, IncidentStore,
    MonitorIncidentRow,
};
use crate::monitor::{MonitorCheck, MonitorStatus, ProbeOutcome, ReasonCode};
use crate::notifications::{DeliveryStrategy, Notification, NotificationColor, NotificationEngine, NotificationEvent};

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
            .as_deref()
            .map(str::trim)
            .filter(|name| !name.is_empty())
            .map(str::to_string)
            .unwrap_or_else(|| self.check.url.to_string())
    }
}

#[derive(Clone, Debug)]
pub struct IncidentOrchestratorConfig {
    pub evaluator_config: IncidentEvaluatorConfig,
    pub public_base_url: String,
}

impl IncidentOrchestratorConfig {
    pub fn from_config(config: &crate::config::Config) -> Self {
        Self {
            evaluator_config: IncidentEvaluatorConfig::default(),
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
        job_queue: Arc<JobQueue>,
        history_writer: Option<Arc<AlertHistoryWriter>>,
        incident_store: Option<Arc<IncidentStore>>,
        notification_engine: Option<Arc<NotificationEngine>>,
    ) -> Self {
        let public_base_url = config.public_base_url;

        let dispatcher = AlertDispatcher::new(job_queue, history_writer);
        info!("Incident orchestrator initialized with email delivery via the worker job queue");

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
        let monitor_name = ctx.monitor_name();

        if !alert_config.enabled || !alert_config.on_down {
            return;
        }

        if !self.notification_tracker.should_notify_down(&ctx.check.id, incident_id) {
            return;
        }

        self.send_push_notification(
            NotificationEvent {
                dashboard_id: ctx.check.dashboard_id.clone(),
                monitor_id: ctx.check.id.to_string(),
                event_key: format!("monitor_down:{incident_id}"),
                strategy: DeliveryStrategy::Once,
                notification: Notification {
                    title: format!("{} is down", monitor_name),
                    message: down_message(&monitor_name, ctx.check.url.as_str(), ctx.reason_code),
                    url: Some(self.monitor_url(ctx)),
                    url_title: Some("View Monitor".to_string()),
                    color: NotificationColor::Danger,
                },
            },
        )
        .await;

        let recipients = &alert_config.recipients;
        if recipients.is_empty() {
            return;
        }

        let result = self
            .dispatcher
            .dispatch(
                AlertContext {
                    check_id: &ctx.check.id,
                    site_id: &ctx.check.site_id,
                    dashboard_id: &ctx.check.dashboard_id,
                    monitor_name: &monitor_name,
                    url: ctx.check.url.as_str(),
                    recipients,
                },
                Alert::Down {
                    incident_id,
                    reason_code: ctx.reason_code,
                    status_code: ctx.status_code,
                },
            )
            .await;

        if result {
            self.notification_tracker.mark_notified_down(&ctx.check.id, incident_id);
            info!(
                check_id = %ctx.check.id,
                monitor = %monitor_name,
                recipients = recipients.len(),
                incident_id = %incident_id,
                "Down alert enqueued"
            );
        }
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

        // Alert first: the resolved incident gets no later snapshot, so persisting after the
        // alert is the only chance for notified_resolve_at to reach the incident row.
        self.send_recovery_alert(ctx, incident_id, downtime_duration).await;

        self.persist_incident_snapshot(ctx).await;
    }

    async fn send_recovery_alert(
        &self,
        ctx: &IncidentContext,
        incident_id: uuid::Uuid,
        downtime_duration: Option<Duration>,
    ) {
        let alert_config = &ctx.check.alert;
        let monitor_name = ctx.monitor_name();

        if !alert_config.enabled || !alert_config.on_recovery {
            return;
        }

        let downtime_msg = downtime_duration
            .map(|d| format!(" after {}", humanize_duration(d)))
            .unwrap_or_default();

        self.send_push_notification(
            NotificationEvent {
                dashboard_id: ctx.check.dashboard_id.clone(),
                monitor_id: ctx.check.id.to_string(),
                event_key: format!("monitor_recovery:{incident_id}"),
                strategy: DeliveryStrategy::Once,
                notification: Notification {
                    title: format!("{} is back up", monitor_name),
                    message: format!(
                        "{} ({}) has recovered{}",
                        monitor_name,
                        ctx.check.url,
                        downtime_msg,
                    ),
                    url: Some(self.monitor_url(ctx)),
                    url_title: Some("View Monitor".to_string()),
                    color: NotificationColor::Success,
                },
            },
        )
        .await;

        let recipients = &alert_config.recipients;
        if recipients.is_empty() {
            return;
        }

        let result = self
            .dispatcher
            .dispatch(
                AlertContext {
                    check_id: &ctx.check.id,
                    site_id: &ctx.check.site_id,
                    dashboard_id: &ctx.check.dashboard_id,
                    monitor_name: &monitor_name,
                    url: ctx.check.url.as_str(),
                    recipients,
                },
                Alert::Recovery {
                    incident_id,
                    downtime_duration,
                },
            )
            .await;

        if result {
            self.notification_tracker.mark_notified_recovery(&ctx.check.id, incident_id);
            info!(
                check_id = %ctx.check.id,
                monitor = %monitor_name,
                recipients = recipients.len(),
                downtime = ?downtime_duration,
                incident_id = %incident_id,
                "Recovery alert enqueued"
            );
        }
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx),
        fields(check_id = %ctx.check.id, days_left = days_left)
    )]
    async fn send_ssl_alert(&self, ctx: &IncidentContext, days_left: i32) {
        let alert_config = &ctx.check.alert;
        let monitor_name = ctx.monitor_name();

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

        let (ssl_title, ssl_message) = if expired {
            (
                format!("SSL certificate expired for {}", monitor_name),
                ssl_expired_message(&monitor_name, ctx.check.url.as_str(), ctx.tls_not_after),
            )
        } else {
            (
                format!("SSL certificate expiring for {}", monitor_name),
                format!(
                    "The SSL certificate for {} ({}) expires in {} days",
                    monitor_name,
                    ctx.check.url,
                    days_left,
                ),
            )
        };

        self.send_push_notification(
            NotificationEvent {
                dashboard_id: ctx.check.dashboard_id.clone(),
                monitor_id: ctx.check.id.to_string(),
                event_key: ssl_event_key(&ctx.check.id, expired, ctx.tls_not_after, days_left),
                strategy: DeliveryStrategy::Once,
                notification: Notification {
                    title: ssl_title,
                    message: ssl_message,
                    url: Some(self.monitor_url(ctx)),
                    url_title: Some("View Monitor".to_string()),
                    color: if expired { NotificationColor::Danger } else { NotificationColor::Warning },
                },
            },
        )
        .await;

        let recipients = &alert_config.recipients;
        if recipients.is_empty() {
            return;
        }

        let result = self
            .dispatcher
            .dispatch(
                AlertContext {
                    check_id: &ctx.check.id,
                    site_id: &ctx.check.site_id,
                    dashboard_id: &ctx.check.dashboard_id,
                    monitor_name: &monitor_name,
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
                monitor = %monitor_name,
                days_left = days_left,
                recipients = recipients.len(),
                "SSL alert enqueued"
            );
        }
    }

    pub async fn prune_inactive(&self, active_ids: &HashSet<String>) {
        self.evaluator.prune_inactive(active_ids);
        self.notification_tracker.prune_inactive(active_ids);
    }

    fn monitor_url(&self, ctx: &IncidentContext) -> String {
        format!(
            "{}/dashboard/{}/monitoring/{}",
            self.public_base_url, ctx.check.dashboard_id, ctx.check.id,
        )
    }

    async fn send_push_notification(&self, event: NotificationEvent) {
        if let Some(engine) = &self.notification_engine {
            engine.notify(event).await;
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

/// Integration text for a down alert. Certificate problems are named, since "not responding"
/// would send the reader looking for an outage instead of a certificate to fix.
fn down_message(monitor_name: &str, url: &str, reason_code: ReasonCode) -> String {
    if reason_code.as_str().starts_with("tls_") {
        format!("{monitor_name} ({url}) is down: {}", reason_code.to_message())
    } else {
        format!("{monitor_name} ({url}) is not responding")
    }
}

fn ssl_expired_message(
    monitor_name: &str,
    url: &str,
    expiry_date: Option<chrono::DateTime<chrono::Utc>>,
) -> String {
    match expiry_date {
        Some(date) => format!(
            "The SSL certificate for {monitor_name} ({url}) expired on {}",
            date.format("%B %-d, %Y")
        ),
        None => format!("The SSL certificate for {monitor_name} ({url}) has expired"),
    }
}

/// Send-once key for integrations: one per certificate when expired, one per milestone of a
/// certificate when expiring, so a renewed certificate or the next milestone alerts again.
fn ssl_event_key(
    check_id: &str,
    expired: bool,
    expiry_date: Option<chrono::DateTime<chrono::Utc>>,
    days_left: i32,
) -> String {
    let expiry = expiry_bucket(expiry_date);
    if expired {
        format!("ssl_expired:{check_id}:{expiry}")
    } else {
        format!("ssl_expiring:{check_id}:{expiry}:{days_left}")
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
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Utc};

    #[test]
    fn down_message_names_certificate_problems() {
        assert_eq!(
            down_message("Shop", "https://shop.example/", ReasonCode::TlsExpired),
            "Shop (https://shop.example/) is down: SSL certificate has expired"
        );
        assert_eq!(
            down_message("Shop", "https://shop.example/", ReasonCode::TlsHostnameMismatch),
            "Shop (https://shop.example/) is down: SSL certificate hostname mismatch"
        );
        assert_eq!(
            down_message("Shop", "https://shop.example/", ReasonCode::HttpConnectError),
            "Shop (https://shop.example/) is not responding"
        );
    }

    #[test]
    fn ssl_expired_message_shows_the_expiry_date() {
        let cert = Utc.with_ymd_and_hms(2015, 4, 12, 23, 59, 59).unwrap();
        assert_eq!(
            ssl_expired_message("Shop", "https://shop.example/", Some(cert)),
            "The SSL certificate for Shop (https://shop.example/) expired on April 12, 2015"
        );
    }

    #[test]
    fn ssl_event_keys_are_per_certificate_and_milestone() {
        let cert = Utc.with_ymd_and_hms(2026, 1, 1, 0, 0, 0).unwrap();
        let renewed = Utc.with_ymd_and_hms(2026, 4, 1, 0, 0, 0).unwrap();

        assert_eq!(
            ssl_event_key("check-1", true, Some(cert), -3),
            format!("ssl_expired:check-1:{}", cert.timestamp())
        );
        // The expired key ignores days_left, so the same certificate alerts once
        assert_eq!(
            ssl_event_key("check-1", true, Some(cert), -3),
            ssl_event_key("check-1", true, Some(cert), -40)
        );
        assert_ne!(
            ssl_event_key("check-1", true, Some(cert), -3),
            ssl_event_key("check-1", true, Some(renewed), -3)
        );

        assert_eq!(
            ssl_event_key("check-1", false, Some(cert), 14),
            format!("ssl_expiring:check-1:{}:14", cert.timestamp())
        );
        assert_ne!(
            ssl_event_key("check-1", false, Some(cert), 14),
            ssl_event_key("check-1", false, Some(cert), 7)
        );
        assert_ne!(
            ssl_event_key("check-1", false, Some(cert), 14),
            ssl_event_key("check-1", false, Some(renewed), 14)
        );
    }
}
