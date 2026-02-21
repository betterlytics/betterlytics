use async_trait::async_trait;
use serde::Deserialize;
use tracing::{debug, error};

use crate::notifications::notifier::{Notification, Notifier, NotifierError};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PushoverConfig {
    user_key: String,
    #[serde(default)]
    priority: Option<i8>,
}

#[derive(Deserialize)]
struct PushoverResponse {
    status: i32,
    #[serde(default)]
    errors: Option<Vec<String>>,
}

pub struct PushoverNotifier {
    client: reqwest::Client,
    app_token: String,
}

impl PushoverNotifier {
    pub fn new(app_token: String) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .expect("failed to build pushover HTTP client"),
            app_token,
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

        let priority = pushover_config.priority.unwrap_or(0);

        let priority_str = priority.to_string();
        let mut form = vec![
            ("token", self.app_token.as_str()),
            ("user", pushover_config.user_key.as_str()),
            ("title", notification.title.as_str()),
            ("message", notification.message.as_str()),
            ("priority", &priority_str),
        ];

        if let Some(url) = &notification.url {
            form.push(("url", url.as_str()));
        }

        if let Some(url_title) = &notification.url_title {
            form.push(("url_title", url_title.as_str()));
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
