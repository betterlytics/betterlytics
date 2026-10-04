use std::sync::Arc;

use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};
use url::Url;

use crate::monitor::guard::{self, GuardedResolver};
use crate::notifications::notifier::{error_body_preview, Notification, Notifier, NotifierError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DiscordConfig {
    webhook_url: String,
}

#[derive(serde::Serialize)]
struct DiscordEmbed {
    title: String,
    description: String,
    color: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    url: Option<String>,
}

#[derive(serde::Serialize)]
struct DiscordWebhookPayload {
    embeds: Vec<DiscordEmbed>,
}

pub struct DiscordNotifier {
    client: reqwest::Client,
}

impl DiscordNotifier {
    pub fn new() -> Result<Self, reqwest::Error> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .dns_resolver(Arc::new(GuardedResolver))
            // Discord webhook execution never redirects
            .redirect(reqwest::redirect::Policy::none())
            .build()?;

        Ok(Self { client })
    }
}

#[async_trait]
impl Notifier for DiscordNotifier {
    fn integration_type(&self) -> &'static str {
        "discord"
    }

    async fn send(
        &self,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), NotifierError> {
        let discord_config = DiscordConfig::deserialize(config)
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;
        let url = Url::parse(&discord_config.webhook_url)
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;
        guard::validate_vendor_webhook_url(&url, &guard::DISCORD_WEBHOOK)
            .map_err(|e| NotifierError::InvalidConfig(e.message))?;

        let mut description = notification.message.clone();
        if let Some(url) = &notification.url {
            let label = notification.url_title.as_deref().unwrap_or("Open");
            description.push_str(&format!("\n\n[{label}]({url})"));
        }

        let payload = DiscordWebhookPayload {
            embeds: vec![DiscordEmbed {
                title: notification.title.clone(),
                description,
                color: notification.color.to_hex(),
                url: notification.url.clone(),
            }],
        };

        debug!(integration = "discord", "sending notification");

        let response = self
            .client
            .post(url)
            .json(&payload)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = error_body_preview(response).await;

            let msg = format!("Discord API returned {status}: {body}");

            if status.as_u16() == 429 || status.is_server_error() {
                error!(
                    http_status = %status,
                    body = %body,
                    "Discord webhook transient error"
                );
                return Err(NotifierError::TransientProviderError(msg));
            }

            error!(
                http_status = %status,
                body = %body,
                "Discord webhook rejected notification"
            );
            return Err(NotifierError::ProviderError(msg));
        }

        debug!(integration = "discord", "notification sent successfully");
        Ok(())
    }
}
