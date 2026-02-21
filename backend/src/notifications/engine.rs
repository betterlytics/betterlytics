use std::collections::HashMap;
use std::sync::Arc;

use tracing::{debug, error, info, warn};

use super::cache::IntegrationCache;
use super::history::NotificationHistoryWriter;
use super::integrations::pushover::PushoverNotifier;
use super::notifier::{Notification, Notifier};

const MAX_RETRIES: u32 = 2;
const RETRY_DELAY_MS: u64 = 500;

pub struct NotificationEngine {
    cache: Arc<IntegrationCache>,
    notifiers: HashMap<String, Arc<dyn Notifier>>,
    history_writer: Option<Arc<NotificationHistoryWriter>>,
}

impl NotificationEngine {
    pub fn new(
        cache: Arc<IntegrationCache>,
        history_writer: Option<Arc<NotificationHistoryWriter>>,
        pushover_app_token: Option<String>,
    ) -> Self {
        let mut notifiers: HashMap<String, Arc<dyn Notifier>> = HashMap::new();

        if let Some(token) = pushover_app_token {
            let pushover = Arc::new(PushoverNotifier::new(token));
            notifiers.insert(pushover.integration_type().to_string(), pushover);
        }

        info!(
            registered = notifiers.len(),
            "notification engine initialized"
        );

        Self {
            cache,
            notifiers,
            history_writer,
        }
    }

    pub async fn notify(&self, dashboard_id: &str, notification: &Notification) -> usize {
        let integrations = self.cache.get(dashboard_id);

        if integrations.is_empty() {
            debug!(
                dashboard_id = %dashboard_id,
                "no integrations configured - skipping notification"
            );
            return 0;
        }

        let futures: Vec<_> = integrations
            .iter()
            .filter_map(|integration| {
                let notifier = self.notifiers.get(&integration.integration_type)?;
                Some(async {
                    let result =
                        Self::send_with_retry(notifier.as_ref(), &integration.config, notification)
                            .await;
                    (&integration.integration_type, &integration.config, result)
                })
            })
            .collect();

        let results = futures::future::join_all(futures).await;

        let mut sent = 0;
        for (integration_type, _config, result) in &results {
            let (status, error_message) = match result {
                Ok(()) => {
                    sent += 1;
                    info!(
                        dashboard_id = %dashboard_id,
                        integration_type = %integration_type,
                        "notification sent"
                    );
                    ("sent", None)
                }
                Err(err) => {
                    error!(
                        dashboard_id = %dashboard_id,
                        integration_type = %integration_type,
                        error = ?err,
                        "failed to send notification"
                    );
                    ("failed", Some(err.to_string()))
                }
            };

            self.record_history(
                dashboard_id,
                integration_type,
                &notification.title,
                status,
                error_message,
            );
        }

        sent
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
