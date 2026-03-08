use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::Result;
use chrono::{DateTime, Utc};
use moka::sync::Cache;
use tracing::{debug, error, info, warn};

use super::cache::IntegrationCache;
use super::history::NotificationHistoryWriter;
use super::notifier::{Notification, Notifier};

const MAX_RETRIES: u32 = 2;
const RETRY_DELAY_MS: u64 = 500;
const DELIVERY_LOG_TTL: Duration = Duration::from_hours(30 * 24);

#[derive(Debug, Clone)]
pub enum DeliveryStrategy {
    /// Send once per event key. Never re-sends for the same key
    Once,
    /// Send at most once per cooldown period
    #[allow(dead_code)]
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
    history_writer: Arc<NotificationHistoryWriter>,
    delivery_log: Cache<String, Instant>,
}

impl NotificationEngine {
    pub fn new(
        cache: Arc<IntegrationCache>,
        history_writer: Arc<NotificationHistoryWriter>,
        notifiers: HashMap<String, Arc<dyn Notifier>>,
        seeded_keys: impl IntoIterator<Item = (String, DateTime<Utc>)>,
    ) -> Result<Self> {
        let now = Instant::now();
        let utc_now = Utc::now();

        let delivery_log: Cache<String, Instant> = Cache::builder()
            .time_to_live(DELIVERY_LOG_TTL)
            .build();

        for (key, sent_at) in seeded_keys {
            let elapsed = utc_now
                .signed_duration_since(sent_at)
                .to_std()
                .unwrap_or(Duration::ZERO);
            let instant = now.checked_sub(elapsed).unwrap_or(now);
            delivery_log.insert(key, instant);
        }

        info!(
            registered_notifiers = notifiers.len(),
            seeded_keys = delivery_log.entry_count(),
            "notification engine initialized"
        );

        Ok(Self {
            cache,
            notifiers,
            history_writer,
            delivery_log,
        })
    }

    pub async fn notify(&self, event: NotificationEvent) -> usize {
        let integrations = self.cache.get(&event.dashboard_id);

        if integrations.is_empty() {
            debug!(
                dashboard_id = %event.dashboard_id,
                "no integrations configured - skipping notification"
            );
            return 0;
        }

        if !self.try_claim_delivery(&event) {
            debug!(
                event_key = %event.event_key,
                "duplicate notification found - skipping"
            );
            return 0;
        }

        let futures: Vec<_> = integrations
            .iter()
            .filter_map(|integration| {
                let notifier = self.notifiers.get(&integration.integration_type)?;
                let metadata = notifier.audit_metadata(&integration.config);
                Some(async {
                    let (result, attempts) = Self::send_with_retry(
                        notifier.as_ref(),
                        &integration.config,
                        &event.notification,
                    )
                    .await;
                    (&integration.integration_type, result, attempts, metadata)
                })
            })
            .collect();

        let results = futures::future::join_all(futures).await;

        let mut sent = 0;
        for (integration_type, result, attempts, metadata) in &results {
            let error_string;
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
                    error_string = err.to_string();
                    ("failed", Some(error_string.as_str()))
                }
            };

            self.record_history(super::history::NotificationHistoryRow {
                ts: chrono::Utc::now(),
                dashboard_id: event.dashboard_id.clone(),
                event_key: event.event_key.clone(),
                integration_type: integration_type.to_string(),
                title: event.notification.title.clone(),
                message: event.notification.message.clone(),
                status: status.to_string(),
                error_message: error_message.unwrap_or_default().to_string(),
                attempt_count: *attempts,
                metadata: metadata.to_string(),
            });
        }

        if sent == 0 {
            self.delivery_log.remove(&event.event_key);
        }

        sent
    }

    fn try_claim_delivery(&self, event: &NotificationEvent) -> bool {
        if let Some(last_sent) = self.delivery_log.get(&event.event_key) {
            match &event.strategy {
                DeliveryStrategy::Once => return false,
                DeliveryStrategy::Cooldown(duration) => {
                    if last_sent.elapsed() < *duration {
                        return false;
                    }
                }
            }
        }
        self.delivery_log.insert(event.event_key.clone(), Instant::now());
        true
    }

    async fn send_with_retry(
        notifier: &dyn Notifier,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> (Result<(), super::notifier::NotifierError>, u8) {
        for attempt in 1..=(MAX_RETRIES+1) {
            match notifier.send(config, notification).await {
                Ok(()) => return (Ok(()), attempt as u8),
                Err(err) => {
                    if !err.is_transient() || attempt == MAX_RETRIES {
                        return (Err(err), attempt as u8);
                    }
                    warn!(
                        attempt = attempt,
                        max_retries = MAX_RETRIES,
                        error = ?err,
                        "transient notification error, retrying"
                    );
                    tokio::time::sleep(std::time::Duration::from_millis(
                        RETRY_DELAY_MS * (attempt as u64),
                    ))
                    .await;
                }
            }
        }

        unreachable!("loop always returns on Ok or Err")
    }

    fn record_history(&self, row: super::history::NotificationHistoryRow) {
        if let Err(e) = self.history_writer.enqueue_rows(vec![row]) {
            warn!(error = ?e, "failed to record notification history");
        }
    }
}
