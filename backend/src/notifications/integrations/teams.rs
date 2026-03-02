use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};

use crate::notifications::notifier::{Notification, Notifier, NotifierError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TeamsConfig {
    webhook_url: String,
}

pub struct TeamsNotifier {
    client: reqwest::Client,
}

impl TeamsNotifier {
    pub fn new() -> Result<Self, reqwest::Error> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        Ok(Self { client })
    }
}

#[async_trait]
impl Notifier for TeamsNotifier {
    fn integration_type(&self) -> &'static str {
        "teams"
    }

    async fn send(
        &self,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), NotifierError> {
        let teams_config = TeamsConfig::deserialize(config)
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;

        let title_color = match notification.color {
            crate::notifications::NotificationColor::Danger => "Attention",
            crate::notifications::NotificationColor::Success => "Good",
            crate::notifications::NotificationColor::Warning => "Warning",
            _ => "Default",
        };

        let mut body_blocks = vec![
            serde_json::json!({
                "type": "TextBlock",
                "text": notification.title,
                "weight": "Bolder",
                "size": "Medium",
                "wrap": true,
                "color": title_color
            }),
            serde_json::json!({
                "type": "TextBlock",
                "text": notification.message,
                "wrap": true
            }),
        ];

        if let Some(url) = &notification.url {
            let label = notification.url_title.as_deref().unwrap_or("Open");
            body_blocks.push(serde_json::json!({
                "type": "ActionSet",
                "actions": [{
                    "type": "Action.OpenUrl",
                    "title": label,
                    "url": url
                }]
            }));
        }

        let payload = serde_json::json!({
            "type": "message",
            "attachments": [{
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "type": "AdaptiveCard",
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "version": "1.2",
                    "body": body_blocks
                }
            }]
        });

        debug!(integration = "teams", "sending notification");

        let response = self
            .client
            .post(&teams_config.webhook_url)
            .json(&payload)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "failed to read response body".to_string());

            let msg = format!("Teams webhook returned {status}: {body}");

            if status.as_u16() == 429 || status.is_server_error() {
                error!(
                    http_status = %status,
                    body = %body,
                    "Teams webhook transient error"
                );
                return Err(NotifierError::TransientProviderError(msg));
            }

            error!(
                http_status = %status,
                body = %body,
                "Teams webhook rejected notification"
            );
            return Err(NotifierError::ProviderError(msg));
        }

        debug!(integration = "teams", "notification sent successfully");
        Ok(())
    }
}
