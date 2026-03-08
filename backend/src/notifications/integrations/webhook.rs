use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};

use crate::notifications::notifier::{Notification, Notifier, NotifierError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WebhookConfig {
    webhook_url: String,
}

pub struct WebhookNotifier {
    client: reqwest::Client,
}

impl WebhookNotifier {
    pub fn new() -> Result<Self, reqwest::Error> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        Ok(Self { client })
    }
}

#[async_trait]
impl Notifier for WebhookNotifier {
    fn integration_type(&self) -> &'static str {
        "webhook"
    }

    async fn send(
        &self,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), NotifierError> {
        let webhook_config = WebhookConfig::deserialize(config)
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;

        let mut payload = serde_json::json!({
            "title": notification.title,
            "message": notification.message,
            "color": notification.color.to_hex_string(),
        });

        if let Some(url) = &notification.url {
            payload["url"] = serde_json::json!(url);
        }

        if let Some(url_title) = &notification.url_title {
            payload["url_title"] = serde_json::json!(url_title);
        }

        debug!(integration = "webhook", "sending notification");

        let response = self
            .client
            .post(&webhook_config.webhook_url)
            .json(&payload)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "failed to read response body".to_string());

            let msg = format!("Webhook returned {status}: {body}");

            if status.as_u16() == 429 || status.is_server_error() {
                error!(
                    http_status = %status,
                    body = %body,
                    "Webhook transient error"
                );
                return Err(NotifierError::TransientProviderError(msg));
            }

            error!(
                http_status = %status,
                body = %body,
                "Webhook rejected notification"
            );
            return Err(NotifierError::ProviderError(msg));
        }

        debug!(integration = "webhook", "notification sent successfully");
        Ok(())
    }
}
