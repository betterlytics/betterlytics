use async_trait::async_trait;
use reqwest::Client;
use tracing::{info, warn};

use super::channel::{AlertChannel, AlertMessage, ChannelType};
use super::pushover;
use crate::config::PushoverConfig;

pub struct PushoverAlertChannel {
    client: Client,
    api_token: String,
}

impl PushoverAlertChannel {
    pub fn new(config: PushoverConfig) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("Failed to build Pushover HTTP client"),
            api_token: config.api_token,
        }
    }
}

#[async_trait]
impl AlertChannel for PushoverAlertChannel {
    fn channel_type(&self) -> ChannelType {
        ChannelType::Pushover
    }

    async fn send(
        &self,
        message: &AlertMessage,
        recipients: &[String],
    ) -> Result<(), anyhow::Error> {
        for user_key in recipients {
            let req = pushover::build_pushover_from_message(message);

            let form = vec![
                ("token", self.api_token.clone()),
                ("user", user_key.clone()),
                ("title", req.title),
                ("message", req.message),
                ("url", req.url),
                ("url_title", req.url_title),
                ("priority", req.priority.to_string()),
                ("timestamp", chrono::Utc::now().timestamp().to_string()),
                ("html", "1".to_string()),
            ];

            let response = self
                .client
                .post("https://api.pushover.net/1/messages.json")
                .form(&form)
                .send()
                .await?;

            let status = response.status();
            if !status.is_success() {
                let body = response.text().await.unwrap_or_default();
                let body_len = body.len();
                warn!(status = status.as_u16(), body_len, "Pushover API error");
                return Err(anyhow::anyhow!(
                    "Pushover API returned HTTP {}",
                    status.as_u16(),
                ));
            }

            let key_prefix = &user_key[..user_key.len().min(5)];
            info!(user_key_prefix = key_prefix, "Pushover notification sent");
        }

        Ok(())
    }
}
