//! Core email service for sending emails via API.
//!
//! This module provides a generic email service that can be used across
//! the application for any email-sending needs. Callers construct
//! `EmailRequest` structs with subject, html, text content and pass
//! them to the service for delivery.

use reqwest::Client;
use serde::Serialize;
use thiserror::Error;
use tracing::{info, warn};

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("HTTP request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("API error: {status} - {message}")]
    ApiError { status: u16, message: String },
}

/// Configuration for the email service
#[derive(Clone, Debug)]
pub struct EmailServiceConfig {
    pub api_key: String,
    pub from_email: String,
    pub from_name: String,
    pub dashboard_base_url: String,
}

impl EmailServiceConfig {
    pub fn from_env() -> Option<Self> {
        let api_key = std::env::var("MAILER_SEND_API_TOKEN").ok()?;

        Some(Self {
            api_key,
            from_email: std::env::var("ALERT_FROM_EMAIL")
                .unwrap_or_else(|_| "alerts@betterlytics.io".to_string()),
            from_name: std::env::var("ALERT_FROM_NAME")
                .unwrap_or_else(|_| "Betterlytics Alerts".to_string()),
            dashboard_base_url: std::env::var("DASHBOARD_BASE_URL")
                .unwrap_or_else(|_| "https://betterlytics.io".to_string()),
        })
    }
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
    config: EmailServiceConfig,
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
    pub fn new(config: EmailServiceConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    /// Get the configured dashboard base URL
    pub fn dashboard_base_url(&self) -> &str {
        &self.config.dashboard_base_url
    }

    /// Send an email
    pub async fn send(&self, request: EmailRequest) -> Result<(), EmailError> {
        if request.to.is_empty() {
            return Ok(());
        }

        let to: Vec<EmailAddress> = request
            .to
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
