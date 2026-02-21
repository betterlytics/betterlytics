use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};

use super::cache::IntegrationCache;
use super::history::NotificationHistoryWriter;
use super::integrations::pushover::PushoverNotifier;
use super::notifier::{Notification, Notifier};

const MAX_RETRIES: u32 = 2;
const RETRY_DELAY_MS: u64 = 500;

#[derive(Debug, Clone)]
pub enum DeliveryStrategy {
    /// Send once per event key. Never re-sends for the same key
    Once,
    /// Send at most once per cooldown period
    Cooldown(Duration),
}

pub struct NotificationEvent {
    pub dashboard_id: String,
    /// Unique key for deduplication
    pub event_key: String,
    pub strategy: DeliveryStrategy,
    pub notification: Notification,
}

pub struct NotificationEngine {
    cache: Arc<IntegrationCache>,
    notifiers: HashMap<String, Arc<dyn Notifier>>,
    history_writer: Option<Arc<NotificationHistoryWriter>>,
    delivery_log: RwLock<HashMap<String, Instant>>,
}

impl NotificationEngine {
    pub fn new(
        cache: Arc<IntegrationCache>,
        history_writer: Option<Arc<NotificationHistoryWriter>>,
        pushover_app_token: Option<String>,
        seeded_keys: impl IntoIterator<Item = String>,
    ) -> Self {
        let mut notifiers: HashMap<String, Arc<dyn Notifier>> = HashMap::new();

        if let Some(token) = pushover_app_token {
            let pushover = Arc::new(PushoverNotifier::new(token));
            notifiers.insert(pushover.integration_type().to_string(), pushover);
        }

        let now = Instant::now();
        let delivery_log: HashMap<String, Instant> =
            seeded_keys.into_iter().map(|key| (key, now)).collect();

        info!(
            registered_notifiers = notifiers.len(),
            seeded_keys = delivery_log.len(),
            "notification engine initialized"
        );

        Self {
            cache,
            notifiers,
            history_writer,
            delivery_log: RwLock::new(delivery_log),
        }
    }

    pub async fn notify(&self, event: NotificationEvent) -> usize {
        if !self.should_deliver(&event).await {
            debug!(
                event_key = %event.event_key,
                "notification deduplicated - skipping"
            );
            return 0;
        }

        let integrations = self.cache.get(&event.dashboard_id);

        if integrations.is_empty() {
            debug!(
                dashboard_id = %event.dashboard_id,
                "no integrations configured - skipping notification"
            );
            return 0;
        }

        let futures: Vec<_> = integrations
            .iter()
            .filter_map(|integration| {
                let notifier = self.notifiers.get(&integration.integration_type)?;
                Some(async {
                    let result = Self::send_with_retry(
                        notifier.as_ref(),
                        &integration.config,
                        &event.notification,
                    )
                    .await;
                    (&integration.integration_type, result)
                })
            })
            .collect();

        let results = futures::future::join_all(futures).await;

        let mut sent = 0;
        for (integration_type, result) in &results {
            let (status, error_message) = match result {
                Ok(()) => {
                    sent += 1;
                    info!(
                        dashboard_id = %event.dashboard_id,
                        integration_type = %integration_type,
                        event_key = %event.event_key,
                        "notification sent"
                    );
                    ("sent", None)
                }
                Err(err) => {
                    error!(
                        dashboard_id = %event.dashboard_id,
                        integration_type = %integration_type,
                        event_key = %event.event_key,
                        error = ?err,
                        "failed to send notification"
                    );
                    ("failed", Some(err.to_string()))
                }
            };

            self.record_history(
                &event.dashboard_id,
                &event.event_key,
                integration_type,
                &event.notification.title,
                status,
                error_message,
            );
        }

        if sent > 0 {
            self.mark_delivered(&event.event_key).await;
        }

        sent
    }

    async fn should_deliver(&self, event: &NotificationEvent) -> bool {
        let log = self.delivery_log.read().await;
        match log.get(&event.event_key) {
            None => true,
            Some(last_sent) => match &event.strategy {
                DeliveryStrategy::Once => false,
                DeliveryStrategy::Cooldown(duration) => last_sent.elapsed() >= *duration,
            },
        }
    }

    async fn mark_delivered(&self, event_key: &str) {
        let mut log = self.delivery_log.write().await;
        log.insert(event_key.to_string(), Instant::now());
    }

    async fn send_with_retry(
        notifier: &dyn Notifier,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), super::notifier::NotifierError> {
        for attempt in 0..=MAX_RETRIES {
            match notifier.send(config, notification).await {
                Ok(()) => return Ok(()),
                Err(err) => {
                    if !err.is_transient() || attempt == MAX_RETRIES {
                        return Err(err);
                    }
                    warn!(
                        attempt = attempt + 1,
                        max_retries = MAX_RETRIES,
                        error = ?err,
                        "transient notification error, retrying"
                    );
                    tokio::time::sleep(std::time::Duration::from_millis(
                        RETRY_DELAY_MS * (attempt as u64 + 1),
                    ))
                    .await;
                }
            }
        }

        unreachable!("loop always returns on Ok or Err")
    }

    fn record_history(
        &self,
        dashboard_id: &str,
        event_key: &str,
        integration_type: &str,
        title: &str,
        status: &str,
        error_message: Option<String>,
    ) {
        let Some(writer) = &self.history_writer else {
            return;
        };

        let row = super::history::NotificationHistoryRow {
            ts: chrono::Utc::now(),
            dashboard_id: dashboard_id.to_string(),
            event_key: event_key.to_string(),
            integration_type: integration_type.to_string(),
            title: title.to_string(),
            status: status.to_string(),
            error_message: error_message.unwrap_or_default(),
        };

        if let Err(e) = writer.enqueue_rows(vec![row]) {
            warn!(error = ?e, "failed to record notification history");
        }
    }
}
