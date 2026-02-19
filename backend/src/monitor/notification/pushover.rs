use anyhow::Result;
use chrono::Duration;
use reqwest::Client;
use tracing::{error, info};

use crate::config::PushoverConfig;
use crate::email::templates::html_escape;
use crate::monitor::alert::Alert;

// ── Message types ──────────────────────────────────────────────────────────

pub struct PushoverMessage {
    pub title: String,
    pub body: String,
    pub url: String,
    pub url_title: String,
    pub priority: i8,
}

// ── Message building ───────────────────────────────────────────────────────

fn truncate(s: &str, max_len: usize) -> String {
    let char_count = s.chars().count();
    if char_count <= max_len {
        s.to_string()
    } else {
        let truncated: String = s.chars().take(max_len.saturating_sub(1)).collect();
        format!("{}…", truncated)
    }
}

pub fn build_pushover_message(
    alert: &Alert,
    monitor_name: &str,
    url: &str,
    dashboard_id: &str,
    check_id: &str,
    base_url: &str,
) -> PushoverMessage {
    let monitor_url = format!(
        "{}/dashboard/{}/monitoring/{}",
        base_url, dashboard_id, check_id
    );

    let (title, body, priority) = match alert {
        Alert::Down {
            reason_code,
            status_code,
        } => {
            let title = format!("Site Down: {}", truncate(monitor_name, 50));
            let mut body = format!(
                "<b>{}</b> is unreachable.\n\nURL: {}\nReason: {}",
                html_escape(monitor_name),
                html_escape(url),
                html_escape(reason_code.to_message()),
            );
            if let Some(code) = status_code {
                body.push_str(&format!("\nStatus: {}", code));
            }
            (title, body, 1i8)
        }
        Alert::Recovery { downtime_duration } => {
            let title = format!("Recovered: {}", truncate(monitor_name, 50));
            let mut body = format!(
                "<b>{}</b> is back online.",
                html_escape(monitor_name),
            );
            if let Some(d) = downtime_duration {
                body.push_str(&format!("\nDowntime: {}", format_duration(*d)));
            }
            (title, body, 0i8)
        }
        Alert::SslExpiring {
            days_left,
            expiry_date,
        } => {
            let title = format!("SSL Expiring: {}", truncate(monitor_name, 50));
            let mut body = format!(
                "SSL certificate for <b>{}</b> expires in {} day{}.",
                html_escape(monitor_name),
                days_left,
                if *days_left == 1 { "" } else { "s" },
            );
            if let Some(date) = expiry_date {
                body.push_str(&format!("\nExpiry: {}", date.format("%Y-%m-%d")));
            }
            (title, body, 0i8)
        }
        Alert::SslExpired { .. } => {
            let title = format!("SSL Expired: {}", truncate(monitor_name, 50));
            let body = format!(
                "SSL certificate for <b>{}</b> has expired!",
                html_escape(monitor_name),
            );
            (title, body, 1i8)
        }
    };

    PushoverMessage {
        title,
        body,
        url: monitor_url,
        url_title: "View Monitor".to_string(),
        priority,
    }
}

// ── HTTP client ────────────────────────────────────────────────────────────

pub struct PushoverClient {
    client: Client,
    api_token: String,
}

impl PushoverClient {
    pub fn new(config: PushoverConfig) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .expect("Failed to build Pushover HTTP client"),
            api_token: config.api_token,
        }
    }

    pub async fn send(&self, user_key: &str, message: &PushoverMessage) -> Result<()> {
        let form = vec![
            ("token", self.api_token.clone()),
            ("user", user_key.to_string()),
            ("title", message.title.clone()),
            ("message", message.body.clone()),
            ("url", message.url.clone()),
            ("url_title", message.url_title.clone()),
            ("priority", message.priority.to_string()),
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
            error!(
                status = status.as_u16(),
                body_len = body.len(),
                "Pushover API error"
            );
            return Err(anyhow::anyhow!(
                "Pushover API returned HTTP {}",
                status.as_u16()
            ));
        }

        let key_prefix = &user_key[..user_key.len().min(5)];
        info!(user_key_prefix = key_prefix, "Pushover notification sent");
        Ok(())
    }
}

// ── Helpers (duplicated from email.rs to avoid touching alert module) ──────

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
