//! Email service for sending alert notifications
//!
//! Uses the MailerSend API to deliver alert emails.
//! Provides templated emails for different alert types.

use chrono::{DateTime, Duration, Utc};
use reqwest::Client;
use serde::Serialize;
use thiserror::Error;
use tracing::{info, warn};

use super::tracker::AlertType;

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

/// Email service for sending alert notifications
pub struct EmailService {
    client: Client,
    config: EmailServiceConfig,
}

#[derive(Serialize)]
struct MailerSendRequest {
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

    /// Send a down alert email
    pub async fn send_down_alert(
        &self,
        recipients: &[String],
        monitor_name: &str,
        url: &str,
        error_message: Option<&str>,
        status_code: Option<u16>,
        dashboard_id: &str,
        monitor_id: &str,
    ) -> Result<(), EmailError> {
        if recipients.is_empty() {
            return Ok(());
        }

        let subject = format!("🔴 Monitor Down: {}", monitor_name);
        let monitor_url = format!(
            "{}/dashboard/{}/monitoring/{}",
            self.config.dashboard_base_url, dashboard_id, monitor_id
        );

        let html = self.build_down_alert_html(monitor_name, url, error_message, status_code, &monitor_url);
        let text = self.build_down_alert_text(monitor_name, url, error_message, status_code, &monitor_url);

        self.send_email(recipients, &subject, &html, &text).await
    }

    /// Send a recovery alert email
    pub async fn send_recovery_alert(
        &self,
        recipients: &[String],
        monitor_name: &str,
        url: &str,
        downtime_duration: Option<Duration>,
        dashboard_id: &str,
        monitor_id: &str,
    ) -> Result<(), EmailError> {
        if recipients.is_empty() {
            return Ok(());
        }

        let subject = format!("✅ Monitor Recovered: {}", monitor_name);
        let monitor_url = format!(
            "{}/dashboard/{}/monitoring/{}",
            self.config.dashboard_base_url, dashboard_id, monitor_id
        );

        let html = self.build_recovery_alert_html(monitor_name, url, downtime_duration, &monitor_url);
        let text = self.build_recovery_alert_text(monitor_name, url, downtime_duration, &monitor_url);

        self.send_email(recipients, &subject, &html, &text).await
    }

    /// Send an SSL expiry alert email
    pub async fn send_ssl_alert(
        &self,
        recipients: &[String],
        monitor_name: &str,
        url: &str,
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
        dashboard_id: &str,
        monitor_id: &str,
    ) -> Result<(), EmailError> {
        if recipients.is_empty() {
            return Ok(());
        }

        let (subject, alert_type) = if days_left <= 0 {
            (
                format!("🔴 SSL Certificate Expired: {}", monitor_name),
                AlertType::SslExpired,
            )
        } else {
            (
                format!("⚠️ SSL Certificate Expiring Soon: {}", monitor_name),
                AlertType::SslExpiring,
            )
        };

        let monitor_url = format!(
            "{}/dashboard/{}/monitoring/{}",
            self.config.dashboard_base_url, dashboard_id, monitor_id
        );

        let html = self.build_ssl_alert_html(monitor_name, url, days_left, expiry_date, &monitor_url, alert_type);
        let text = self.build_ssl_alert_text(monitor_name, url, days_left, expiry_date, &monitor_url, alert_type);

        self.send_email(recipients, &subject, &html, &text).await
    }

    async fn send_email(
        &self,
        recipients: &[String],
        subject: &str,
        html: &str,
        text: &str,
    ) -> Result<(), EmailError> {
        let to: Vec<EmailAddress> = recipients
            .iter()
            .map(|email| EmailAddress {
                email: email.clone(),
                name: None,
            })
            .collect();

        let request = MailerSendRequest {
            from: EmailAddress {
                email: self.config.from_email.clone(),
                name: Some(self.config.from_name.clone()),
            },
            to,
            subject: subject.to_string(),
            html: html.to_string(),
            text: text.to_string(),
        };

        let response = self
            .client
            .post("https://api.mailersend.com/v1/email")
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let message = response.text().await.unwrap_or_default();
            warn!(
                status = status.as_u16(),
                message = %message,
                "Failed to send alert email"
            );
            return Err(EmailError::ApiError {
                status: status.as_u16(),
                message,
            });
        }

        info!(
            recipients = recipients.len(),
            subject = %subject,
            "Alert email sent successfully"
        );

        Ok(())
    }

    fn build_down_alert_html(
        &self,
        monitor_name: &str,
        url: &str,
        error_message: Option<&str>,
        status_code: Option<u16>,
        monitor_url: &str,
    ) -> String {
        let error_section = if let Some(err) = error_message {
            format!(
                r#"<p style="margin: 8px 0;"><strong>Error:</strong> {}</p>"#,
                html_escape(err)
            )
        } else {
            String::new()
        };

        let status_section = if let Some(code) = status_code {
            format!(
                r#"<p style="margin: 8px 0;"><strong>Status Code:</strong> {}</p>"#,
                code
            )
        } else {
            String::new()
        };

        format!(
            r#"{header}
            <h1>Monitor Alert</h1>
            <div class="alert-box">
                <h3 style="{error_heading}">🔴 Monitor Down</h3>
                <p style="margin: 0;"><strong>{monitor_name}</strong> is currently unreachable.</p>
            </div>
            
            <div class="content-section">
                <p style="margin: 8px 0;"><strong>URL:</strong> <a href="{url}" style="color: #2563eb;">{url}</a></p>
                <p style="margin: 8px 0;"><strong>Time:</strong> {time}</p>
                {status_section}
                {error_section}
            </div>

            <div class="center">
                <a href="{monitor_url}" class="button">View Monitor Details</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                We'll notify you again when the monitor recovers.
            </p>
            {signature}
            {footer}"#,
            header = email_header(),
            error_heading = "margin: 0 0 10px 0; color: #dc2626; font-size: 18px;",
            monitor_name = html_escape(monitor_name),
            url = html_escape(url),
            time = Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            status_section = status_section,
            error_section = error_section,
            monitor_url = monitor_url,
            signature = email_signature(),
            footer = email_footer(),
        )
    }

    fn build_down_alert_text(
        &self,
        monitor_name: &str,
        url: &str,
        error_message: Option<&str>,
        status_code: Option<u16>,
        monitor_url: &str,
    ) -> String {
        let mut text = format!(
            "MONITOR ALERT - DOWN\n\n\
            Monitor: {}\n\
            URL: {}\n\
            Time: {}\n",
            monitor_name,
            url,
            Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        );

        if let Some(code) = status_code {
            text.push_str(&format!("Status Code: {}\n", code));
        }

        if let Some(err) = error_message {
            text.push_str(&format!("Error: {}\n", err));
        }

        text.push_str(&format!(
            "\nView monitor details: {}\n\n\
            We'll notify you again when the monitor recovers.\n\n\
            {}",
            monitor_url,
            text_footer(),
        ));

        text
    }

    fn build_recovery_alert_html(
        &self,
        monitor_name: &str,
        url: &str,
        downtime_duration: Option<Duration>,
        monitor_url: &str,
    ) -> String {
        let downtime_section = if let Some(duration) = downtime_duration {
            format!(
                r#"<p style="margin: 8px 0;"><strong>Downtime Duration:</strong> {}</p>"#,
                format_duration(duration)
            )
        } else {
            String::new()
        };

        format!(
            r#"{header}
            <h1>Monitor Recovered</h1>
            <div class="success-box">
                <h3 style="{success_heading}">✅ Back Online</h3>
                <p style="margin: 0;"><strong>{monitor_name}</strong> is now responding normally.</p>
            </div>
            
            <div class="content-section">
                <p style="margin: 8px 0;"><strong>URL:</strong> <a href="{url}" style="color: #2563eb;">{url}</a></p>
                <p style="margin: 8px 0;"><strong>Recovered At:</strong> {time}</p>
                {downtime_section}
            </div>

            <div class="center">
                <a href="{monitor_url}" class="button button-success">View Monitor Details</a>
            </div>
            {signature}
            {footer}"#,
            header = email_header(),
            success_heading = "margin: 0 0 10px 0; color: #059669; font-size: 18px;",
            monitor_name = html_escape(monitor_name),
            url = html_escape(url),
            time = Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            downtime_section = downtime_section,
            monitor_url = monitor_url,
            signature = email_signature(),
            footer = email_footer(),
        )
    }

    fn build_recovery_alert_text(
        &self,
        monitor_name: &str,
        url: &str,
        downtime_duration: Option<Duration>,
        monitor_url: &str,
    ) -> String {
        let mut text = format!(
            "MONITOR RECOVERED\n\n\
            Monitor: {}\n\
            URL: {}\n\
            Recovered At: {}\n",
            monitor_name,
            url,
            Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        );

        if let Some(duration) = downtime_duration {
            text.push_str(&format!("Downtime Duration: {}\n", format_duration(duration)));
        }

        text.push_str(&format!(
            "\nView monitor details: {}\n\n{}",
            monitor_url,
            text_footer(),
        ));

        text
    }

    fn build_ssl_alert_html(
        &self,
        monitor_name: &str,
        url: &str,
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
        monitor_url: &str,
        alert_type: AlertType,
    ) -> String {
        let (box_class, heading_style, icon, title) = if alert_type == AlertType::SslExpired {
            (
                "alert-box",
                "margin: 0 0 10px 0; color: #dc2626; font-size: 18px;",
                "🔴",
                "SSL Certificate Expired",
            )
        } else {
            (
                "warning-box",
                "margin: 0 0 10px 0; color: #f59e0b; font-size: 18px;",
                "⚠️",
                "SSL Certificate Expiring Soon",
            )
        };

        let expiry_section = if let Some(date) = expiry_date {
            format!(
                r#"<p style="margin: 8px 0;"><strong>Expiry Date:</strong> {}</p>"#,
                date.format("%Y-%m-%d %H:%M:%S UTC")
            )
        } else {
            String::new()
        };

        let days_text = if days_left <= 0 {
            "Certificate has expired!".to_string()
        } else if days_left == 1 {
            "1 day remaining".to_string()
        } else {
            format!("{} days remaining", days_left)
        };

        format!(
            r#"{header}
            <h1>SSL Certificate Alert</h1>
            <div class="{box_class}">
                <h3 style="{heading_style}">{icon} {title}</h3>
                <p style="margin: 0;">The SSL certificate for <strong>{monitor_name}</strong> requires attention.</p>
            </div>
            
            <div class="content-section">
                <p style="margin: 8px 0;"><strong>URL:</strong> <a href="{url}" style="color: #2563eb;">{url}</a></p>
                <p style="margin: 8px 0;"><strong>Status:</strong> {days_text}</p>
                {expiry_section}
            </div>

            <p style="color: #4b5563; margin: 20px 0;">
                Please renew your SSL certificate to avoid service disruption.
            </p>

            <div class="center">
                <a href="{monitor_url}" class="button">View Monitor Details</a>
            </div>
            {signature}
            {footer}"#,
            header = email_header(),
            box_class = box_class,
            heading_style = heading_style,
            icon = icon,
            title = title,
            monitor_name = html_escape(monitor_name),
            url = html_escape(url),
            days_text = days_text,
            expiry_section = expiry_section,
            monitor_url = monitor_url,
            signature = email_signature(),
            footer = email_footer(),
        )
    }

    fn build_ssl_alert_text(
        &self,
        monitor_name: &str,
        url: &str,
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
        monitor_url: &str,
        alert_type: AlertType,
    ) -> String {
        let title = if alert_type == AlertType::SslExpired {
            "SSL CERTIFICATE EXPIRED"
        } else {
            "SSL CERTIFICATE EXPIRING SOON"
        };

        let days_text = if days_left <= 0 {
            "Certificate has expired!".to_string()
        } else if days_left == 1 {
            "1 day remaining".to_string()
        } else {
            format!("{} days remaining", days_left)
        };

        let mut text = format!(
            "{}\n\n\
            Monitor: {}\n\
            URL: {}\n\
            Status: {}\n",
            title, monitor_name, url, days_text,
        );

        if let Some(date) = expiry_date {
            text.push_str(&format!(
                "Expiry Date: {}\n",
                date.format("%Y-%m-%d %H:%M:%S UTC")
            ));
        }

        text.push_str(&format!(
            "\nPlease renew your SSL certificate to avoid service disruption.\n\n\
            View monitor details: {}\n\n{}",
            monitor_url,
            text_footer(),
        ));

        text
    }
}

// Helper functions for email templates

fn email_header() -> &'static str {
    r#"<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Betterlytics Alert</title>
      <style>
        body { 
          margin: 0; 
          padding: 40px 20px; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f8fafc;
        }
        .email-wrapper {
          max-width: 600px; 
          margin: 0 auto;
        }
        .email-content-box { 
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        .email-logo-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .content-section {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin: 20px 0;
        }
        .button { 
          display: inline-block; 
          background-color: #2563eb; 
          color: #ffffff !important; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
          font-size: 16px;
        }
        .button-success { background-color: #16a34a; }
        .button-danger { background-color: #dc2626; }
        .alert-box { 
          background-color: #fef2f2; 
          border-left: 4px solid #dc2626; 
          padding: 20px; 
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .success-box {
          background-color: #f0fdf4;
          border-left: 4px solid #16a34a;
          padding: 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .warning-box {
          background-color: #fefce8;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        h1 {
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 20px 0;
        }
        h3 {
          color: #374151;
          font-size: 18px;
          font-weight: 600;
          margin: 20px 0 10px 0;
        }
        p {
          color: #4b5563;
          font-size: 16px;
          margin: 16px 0;
        }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-content-box">
          <div class="email-logo-header">
            <img 
              src="https://betterlytics.io/betterlytics-logo-dark-simple-96x96-q75.png"
              alt="Betterlytics"
              width="48"
              height="48"
              style="display: block; border: 0; width: 48px; height: 48px; margin-right: 12px;"
            />
            <div style="color: #1f2937; font-size: 20px; font-weight: 600;">Betterlytics</div>
          </div>"#
}

fn email_signature() -> &'static str {
    r#"<div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; font-weight: 500;">
        Best regards,<br>
        <strong style="color: #374151;">The Betterlytics Team</strong>
      </p>
    </div>"#
}

fn email_footer() -> &'static str {
    r#"</div>
        <div style="text-align: center; margin-top: 30px; padding: 20px;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
            © 2025 Betterlytics. All rights reserved.<br>
            You're receiving this alert because you have monitoring enabled for this site.
          </p>
        </div>
      </div>
    </body>
    </html>"#
}

fn text_footer() -> &'static str {
    "---\n\
    Best regards,\n\
    The Betterlytics Team\n\n\
    © 2025 Betterlytics. All rights reserved.\n\
    You're receiving this alert because you have monitoring enabled for this site."
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn format_duration(duration: Duration) -> String {
    let total_seconds = duration.num_seconds();

    if total_seconds < 60 {
        format!("{} seconds", total_seconds)
    } else if total_seconds < 3600 {
        let minutes = total_seconds / 60;
        let seconds = total_seconds % 60;
        if seconds == 0 {
            format!("{} minute{}", minutes, if minutes == 1 { "" } else { "s" })
        } else {
            format!("{} min {} sec", minutes, seconds)
        }
    } else if total_seconds < 86400 {
        let hours = total_seconds / 3600;
        let minutes = (total_seconds % 3600) / 60;
        if minutes == 0 {
            format!("{} hour{}", hours, if hours == 1 { "" } else { "s" })
        } else {
            format!("{} hr {} min", hours, minutes)
        }
    } else {
        let days = total_seconds / 86400;
        let hours = (total_seconds % 86400) / 3600;
        if hours == 0 {
            format!("{} day{}", days, if days == 1 { "" } else { "s" })
        } else {
            format!(
                "{} day{} {} hr",
                days,
                if days == 1 { "" } else { "s" },
                hours
            )
        }
    }
}
