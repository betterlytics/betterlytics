use reqwest::Client;
use serde::Serialize;
use thiserror::Error;
use tracing::{info, warn};

use crate::config::EmailConfig;

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("HTTP request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("API error: {status} - {message}")]
    ApiError { status: u16, message: String },
}

#[derive(Clone, Debug)]
pub struct EmailRequest {
    pub to: Vec<String>,
    pub subject: String,
    pub html: String,
    pub text: String,
}

pub struct EmailService {
    client: Client,
    config: EmailConfig,
}

#[derive(Serialize)]
struct SendRequest {
    from: EmailAddress,
    to: Vec<EmailAddress>,
    subject: String,
    html: String,
    text: String,
}

#[derive(Serialize)]
struct EmailAddress {
    email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
}

impl EmailService {
    pub fn new(config: EmailConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    /// In development mode, only emails to @betterlytics.io addresses are permitted
    pub async fn send(&self, request: EmailRequest) -> Result<(), EmailError> {
        if request.to.is_empty() {
            return Ok(());
        }

        let recipients = if self.config.is_development {
            let allowed: Vec<String> = request
                .to
                .iter()
                .filter(|email| email.ends_with("@betterlytics.io"))
                .cloned()
                .collect();

            let blocked_count = request.to.len() - allowed.len();
            if blocked_count > 0 {
                warn!(
                    blocked = blocked_count,
                    allowed = allowed.len(),
                    "Development mode: blocked emails to non-@betterlytics.io addresses"
                );
            }

            if allowed.is_empty() {
                info!(
                    subject = %request.subject,
                    "Development mode: no @betterlytics.io recipients, skipping email"
                );
                return Ok(());
            }

            allowed
        } else {
            request.to.clone()
        };

        let to = recipients
            .iter()
            .map(|email| EmailAddress {
                email: email.clone(),
                name: None,
            })
            .collect();


        let mailer_request = SendRequest {
            from: EmailAddress {
                email: self.config.from_email.clone(),
                name: Some(self.config.from_name.clone()),
            },
            to,
            subject: request.subject.clone(),
            html: request.html,
            text: request.text,
        };

        let response = self
            .client
            .post("https://api.mailersend.com/v1/email")
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&mailer_request)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let message = response.text().await.unwrap_or_default();
            warn!(
                status = status.as_u16(),
                message = %message,
                "Failed to send email"
            );
            return Err(EmailError::ApiError {
                status: status.as_u16(),
                message,
            });
        }

        info!(
            recipients = mailer_request.to.len(),
            subject = %request.subject,
            "Email sent successfully"
        );

        Ok(())
    }
}
