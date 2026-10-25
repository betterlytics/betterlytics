use std::collections::{HashMap, HashSet};
use std::fmt::Debug;
use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use tracing::{debug, info, warn};

use super::alert::{
    Alert, AlertContext, AlertDispatcher, AlertHistoryWriter, NotificationTracker,
};
use crate::jobqueue::JobQueue;
use crate::monitor::incident::reconcile::{
    self, CheckStatus, Reconciliation, known_checks, plan_consistency_check, unpaused_duration,
};
use crate::monitor::incident::{
    IncidentEvaluator, IncidentEvaluatorConfig, IncidentEvent, IncidentSnapshot, IncidentStore,
    MonitorIncidentRow,
};
use crate::monitor::{MonitorCheck, MonitorStatus, PausePeriodSource, ProbeOutcome, ReasonCode};
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
    pause_periods: Option<Arc<dyn PausePeriodSource>>,
    notification_engine: Option<Arc<NotificationEngine>>,
    public_base_url: String,
}

/// Whether a lost resolution is written again from memory or closed at its last failed check.
#[derive(Clone, Copy, PartialEq, Eq)]
enum LostResolution {
    RewriteFromMemory,
    CloseAtLastFailure,
}

impl IncidentOrchestrator {
    pub async fn new(
        config: IncidentOrchestratorConfig,
        job_queue: Arc<JobQueue>,
        history_writer: Option<Arc<AlertHistoryWriter>>,
        incident_store: Option<Arc<IncidentStore>>,
        pause_periods: Option<Arc<dyn PausePeriodSource>>,
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
            pause_periods,
            notification_engine,
            public_base_url,
        }
    }

    /// Closes stored ongoing incidents that break "one ongoing incident per check": older
    /// duplicates, ones memory already resolved and ones of deleted checks, each at its last
    /// failed check and without notifications. Paused checks are left alone. Runs at startup
    /// and hourly; does nothing when the check list failed to load or is empty.
    pub async fn run_consistency_check<E: Debug>(&self, checks: Result<Vec<MonitorCheck>, E>) {
        let Some(store) = &self.incident_store else {
            return;
        };

        let statuses = checks.as_ref().map(|checks| {
            checks
                .iter()
                .map(|c| {
                    let status = if c.is_enabled { CheckStatus::Active } else { CheckStatus::Paused };
                    (c.id.clone(), status)
                })
                .collect::<Vec<_>>()
        });
        let Some(known) = known_checks(statuses) else {
            match &checks {
                Err(err) => warn!(error = ?err, "Skipping incident consistency check: monitor list failed to load"),
                Ok(_) => warn!("Skipping incident consistency check: monitor list is empty"),
            }
            return;
        };
        let checks = checks.unwrap_or_default();
        let checks_by_id: HashMap<&str, &MonitorCheck> =
            checks.iter().map(|c| (c.id.as_str(), c)).collect();

        let stored = match store.load_active_incidents().await {
            Ok(stored) => stored,
            Err(err) => {
                warn!(error = ?err, "Skipping incident consistency check: incidents failed to load");
                return;
            }
        };

        let plans = plan_consistency_check(&known, stored, |check_id| self.evaluator.snapshot(check_id));
        if plans.is_empty() {
            debug!("Incident consistency check found nothing to close");
            return;
        }

        let mut rows = Vec::new();
        for plan in plans {
            if plan.deleted {
                info!(
                    check_id = %plan.check_id,
                    closed = plan.reconciliation.close.len(),
                    "Closing open incidents of a deleted monitor"
                );
                self.evaluator.remove(&plan.check_id);
                self.notification_tracker.remove(&plan.check_id);
                rows.extend(plan.reconciliation.close.iter().map(MonitorIncidentRow::closed_from_seed));
                continue;
            }

            let Some(check) = checks_by_id.get(plan.check_id.as_str()) else {
                continue;
            };
            let memory = self.evaluator.snapshot(&plan.check_id);
            rows.extend(self.apply_reconciliation(
                check,
                memory.as_ref(),
                plan.reconciliation,
                LostResolution::CloseAtLastFailure,
            ));
        }

        self.enqueue_incident_rows(rows);
    }

    /// Before a check opens a new incident: continue a stored ongoing one instead, or write the
    /// resolution memory has for it and let the new one open.
    async fn reconcile_before_open(&self, check: &MonitorCheck) {
        let Some(store) = &self.incident_store else {
            return;
        };

        let stored = match store.load_ongoing_for_check(&check.id).await {
            Ok(stored) => stored,
            Err(err) => {
                warn!(check_id = %check.id, error = ?err, "Failed to load stored incidents before opening one");
                return;
            }
        };
        if stored.is_empty() {
            return;
        }

        let memory = self.evaluator.snapshot(&check.id);
        let plan = reconcile::reconcile(memory.as_ref(), stored);
        let rows = self.apply_reconciliation(check, memory.as_ref(), plan, LostResolution::RewriteFromMemory);
        self.enqueue_incident_rows(rows);
    }

    fn apply_reconciliation(
        &self,
        check: &MonitorCheck,
        memory: Option<&IncidentSnapshot>,
        plan: Reconciliation,
        lost_resolution: LostResolution,
    ) -> Vec<MonitorIncidentRow> {
        let mut rows: Vec<MonitorIncidentRow> =
            plan.close.iter().map(MonitorIncidentRow::closed_from_seed).collect();

        if let Some(seed) = &plan.lost_resolution {
            let rewritten = match (lost_resolution, memory) {
                (LostResolution::RewriteFromMemory, Some(memory)) => MonitorIncidentRow::from_snapshot(
                    memory,
                    check,
                    self.notification_tracker.snapshot(&check.id),
                ),
                _ => None,
            };
            rows.push(rewritten.unwrap_or_else(|| MonitorIncidentRow::closed_from_seed(seed)));
        }

        if let Some(seed) = &plan.adopt
            && self.evaluator.adopt(seed)
        {
            self.notification_tracker.adopt(seed);
            info!(check_id = %check.id, incident_id = %seed.incident_id, "Continuing stored ongoing incident");
        }

        if !rows.is_empty() {
            info!(
                check_id = %check.id,
                closed = plan.close.len(),
                lost_resolution = ?plan.lost_resolution.as_ref().map(|s| s.incident_id),
                "Closing duplicate or stale ongoing incidents"
            );
        }

        rows
    }

    fn enqueue_incident_rows(&self, rows: Vec<MonitorIncidentRow>) {
        let Some(store) = &self.incident_store else {
            return;
        };
        if rows.is_empty() {
            return;
        }
        if let Err(err) = store.enqueue_rows(rows) {
            warn!(error = ?err, "Failed to enqueue incident closures");
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

        if self.evaluator.opens_new_incident(
            &ctx.check.id,
            ctx.consecutive_failures,
            alert_config.failure_threshold,
        ) {
            self.reconcile_before_open(&ctx.check).await;
        }

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
                    message: format!("{} ({}) is not responding", monitor_name, ctx.check.url),
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
                down_since,
                resolved_at,
                downtime_duration,
            }) => {
                let downtime_duration = match down_since {
                    Some(since) => Some(self.unpaused_downtime(&ctx.check.id, since, resolved_at).await),
                    None => downtime_duration,
                };
                debug!(incident_id = %incident_id, downtime = ?downtime_duration, "incident resolved");
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

    /// The downtime from `since` to `until`, leaving out the time the monitor was paused.
    async fn unpaused_downtime(&self, check_id: &str, since: DateTime<Utc>, until: DateTime<Utc>) -> Duration {
        let Some(source) = &self.pause_periods else {
            return until - since;
        };
        match source.fetch_pause_periods(check_id, since).await {
            Ok(pauses) => unpaused_duration(since, until, &pauses),
            Err(err) => {
                warn!(check_id = check_id, error = ?err, "Failed to load pause periods; reporting the full downtime");
                until - since
            }
        }
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
                format!(
                    "The SSL certificate for {} ({}) has expired",
                    monitor_name,
                    ctx.check.url,
                ),
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
                event_key: format!("ssl_{}:{}", if expired { "expired" } else { "expiring" }, ctx.check.id),
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