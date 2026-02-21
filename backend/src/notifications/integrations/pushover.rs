use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};

use crate::notifications::notifier::{Notification, NotificationPriority, Notifier, NotifierError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PushoverConfig {
    user_key: String,
    api_token: String,
}

#[derive(Deserialize)]
struct PushoverResponse {
    status: i32,
    #[serde(default)]
    errors: Option<Vec<String>>,
}

pub struct PushoverNotifier {
    client: reqwest::Client,
}

impl PushoverNotifier {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .expect("failed to build pushover HTTP client"),
        }
    }
}

#[async_trait]
impl Notifier for PushoverNotifier {
    fn integration_type(&self) -> &'static str {
        "pushover"
    }

    async fn send(
        &self,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), NotifierError> {
        let pushover_config: PushoverConfig = serde_json::from_value(config.clone())
            .map_err(|e| NotifierError::InvalidConfig(e.to_string()))?;

        let priority = match notification.priority {
            NotificationPriority::Low => -1,
            NotificationPriority::Normal => 0,
            NotificationPriority::High => 1,
        };

        let mut form = vec![
            ("token", pushover_config.api_token.as_str()),
            ("user", pushover_config.user_key.as_str()),
            ("title", notification.title.as_str()),
            ("message", notification.message.as_str()),
        ];

        let priority_str = priority.to_string();
        form.push(("priority", &priority_str));

        let url_owned;
        if let Some(url) = &notification.url {
            url_owned = url.clone();
            form.push(("url", &url_owned));
        }

        let url_title_owned;
        if let Some(url_title) = &notification.url_title {
            url_title_owned = url_title.clone();
            form.push(("url_title", &url_title_owned));
        }

        debug!(integration = "pushover", "sending notification");

        let response = self
            .client
            .post("https://api.pushover.net/1/messages.json")
            .form(&form)
            .send()
            .await?;

        let status = response.status();
        let body: PushoverResponse = response
            .json()
            .await
            .map_err(|e| NotifierError::ProviderError(format!("Failed to parse response: {e}")))?;

        if body.status != 1 {
            let errors = body.errors.unwrap_or_default().join(", ");
            error!(
                http_status = %status,
                errors = %errors,
                "Pushover API rejected notification"
            );
            return Err(NotifierError::ProviderError(errors));
        }

        debug!(integration = "pushover", "notification sent successfully");
        Ok(())
    }
}
