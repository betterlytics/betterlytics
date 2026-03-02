use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};

use crate::notifications::notifier::{Notification, Notifier, NotifierError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SlackConfig {
    webhook_url: String,
}

pub struct SlackNotifier {
    client: reqwest::Client,
}

impl SlackNotifier {
    pub fn new() -> Result<Self, reqwest::Error> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        Ok(Self { client })
    }
}

#[async_trait]
impl Notifier for SlackNotifier {
    fn integration_type(&self) -> &'static str {
        "slack"
    }

    async fn send(
        &self,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), NotifierError> {
        let slack_config = SlackConfig::deserialize(config)
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;

        let mut text = format!("*{}*\n\n{}", notification.title, notification.message);

        if let Some(url) = &notification.url {
            let label = notification.url_title.as_deref().unwrap_or("Open");
            text.push_str(&format!("\n\n<{}|{}>", url, label));
        }

        let payload = serde_json::json!({
            "attachments": [{
                "color": notification.color.to_hex_string(),
                "blocks": [{
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": text
                    }
                }]
            }]
        });

        debug!(integration = "slack", "sending notification");

        let response = self
            .client
            .post(&slack_config.webhook_url)
            .json(&payload)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "failed to read response body".to_string());

            let msg = format!("Slack webhook returned {status}: {body}");

            if status.as_u16() == 429 || status.is_server_error() {
                error!(
                    http_status = %status,
                    body = %body,
                    "Slack webhook transient error"
                );
                return Err(NotifierError::TransientProviderError(msg));
            }

            error!(
                http_status = %status,
                body = %body,
                "Slack webhook rejected notification"
            );
            return Err(NotifierError::ProviderError(msg));
        }

        debug!(integration = "slack", "notification sent successfully");
        Ok(())
    }
}
