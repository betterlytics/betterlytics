use std::sync::Arc;

use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};
use url::Url;

use crate::monitor::guard::{self, GuardedResolver};
use crate::notifications::notifier::{error_body_preview, Notification, Notifier, NotifierError};

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
            .dns_resolver(Arc::new(GuardedResolver))
            // Logic Apps can answer any 3xx; 301/302 would also turn the POST into a bodiless GET
            .redirect(reqwest::redirect::Policy::none())
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
        let url = Url::parse(&teams_config.webhook_url)
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;
        // Rows saved under the old regex fail here, once, without retry
        guard::validate_vendor_webhook_url(&url, &guard::TEAMS_WEBHOOK)
            .map_err(|e| NotifierError::InvalidConfig(e.message))?;

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
            .post(url)
            .json(&payload)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = error_body_preview(response).await;

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::notifications::notifier::NotificationColor;

    // No network: both URLs fail the vendor rule before any request
    #[tokio::test]
    async fn refuses_non_vendor_urls_without_retry() {
        let notifier = TeamsNotifier::new().unwrap();
        let notification = Notification {
            title: "t".to_string(),
            message: "m".to_string(),
            url: None,
            url_title: None,
            color: NotificationColor::Default,
        };
        for webhook_url in ["https://10.0.0.5/a.logic.azure.com/", "https://attacker.example/x.webhook.office.com/"] {
            let result = notifier
                .send(&serde_json::json!({ "webhookUrl": webhook_url }), &notification)
                .await;
            assert!(matches!(result, Err(NotifierError::InvalidConfig(_))), "{webhook_url}");
            assert!(!result.unwrap_err().is_transient());
        }
    }
}
