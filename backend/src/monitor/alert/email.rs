//! Monitor alert email templates.
//!
//! This module provides template builders for monitor alert emails.
//! Templates produce `EmailRequest` structs that are sent via the
//! core email service.

use chrono::{DateTime, Duration, Utc};

use crate::email::templates::{email_signature, html_escape, wrap_html, wrap_text};
use crate::email::EmailRequest;
use crate::monitor::ReasonCode;

use super::tracker::AlertType;


/// Build a down alert email request
pub fn build_down_alert(
    recipients: &[String],
    monitor_name: &str,
    url: &str,
    reason_code: ReasonCode,
    status_code: Option<u16>,
    public_base_url: &str,
    dashboard_id: &str,
    monitor_id: &str,
) -> EmailRequest {
    let subject = format!("🚨 Uptime Alert: Site Is Down: {}", monitor_name);
    let monitor_url = build_monitor_url(public_base_url, dashboard_id, monitor_id);

    let reason_message = reason_code.to_message();
    let html = build_down_alert_html(monitor_name, url, reason_message, status_code, &monitor_url);
    let text = build_down_alert_text(monitor_name, url, reason_message, status_code, &monitor_url);

    EmailRequest {
        to: recipients.to_vec(),
        subject,
        html,
        text,
    }
}

/// Build a recovery alert email request
pub fn build_recovery_alert(
    recipients: &[String],
    monitor_name: &str,
    url: &str,
    downtime_duration: Option<Duration>,
    public_base_url: &str,
    dashboard_id: &str,
    monitor_id: &str,
) -> EmailRequest {
    let subject = format!("✅ Resolved: Site Is Back Online: {}", monitor_name);
    let monitor_url = build_monitor_url(public_base_url, dashboard_id, monitor_id);

    let html = build_recovery_alert_html(monitor_name, url, downtime_duration, &monitor_url);
    let text = build_recovery_alert_text(monitor_name, url, downtime_duration, &monitor_url);

    EmailRequest {
        to: recipients.to_vec(),
        subject,
        html,
        text,
    }
}

/// Build an SSL expiry alert email request
pub fn build_ssl_alert(
    recipients: &[String],
    monitor_name: &str,
    url: &str,
    days_left: i32,
    expiry_date: Option<DateTime<Utc>>,
    public_base_url: &str,
    dashboard_id: &str,
    monitor_id: &str,
) -> EmailRequest {
    let (subject, alert_type) = if days_left <= 0 {
        (
            format!("🚨 SSL Certificate Expired: {}", monitor_name),
            AlertType::SslExpired,
        )
    } else {
        (
            format!("⚠️ SSL Certificate Expiring Soon: {}", monitor_name),
            AlertType::SslExpiring,
        )
    };

    let monitor_url = build_monitor_url(public_base_url, dashboard_id, monitor_id);

    let html = build_ssl_alert_html(monitor_name, url, days_left, expiry_date, &monitor_url, alert_type);
    let text = build_ssl_alert_text(monitor_name, url, days_left, expiry_date, &monitor_url, alert_type);

    EmailRequest {
        to: recipients.to_vec(),
        subject,
        html,
        text,
    }
}

// --- HTML template builders ---

fn build_down_alert_html(
    monitor_name: &str,
    url: &str,
    reason_message: &str,
    status_code: Option<u16>,
    monitor_url: &str,
) -> String {
    let reason_section = format!(
        r#"<p style="margin: 8px 0;"><strong>Reason:</strong> {}</p>"#,
        html_escape(reason_message)
    );

    let status_section = if let Some(code) = status_code {
        format!(
            r#"<p style="margin: 8px 0;"><strong>Status Code:</strong> {}</p>"#,
            code
        )
    } else {
        String::new()
    };

    let content = format!(
        r#"<h1>Monitor Alert</h1>
            <div class="alert-box">
                <h3 style="{error_heading}">🚨 Monitor Down</h3>
                <p style="margin: 0;"><strong>{monitor_name}</strong> is currently unreachable.</p>
            </div>
            
            <div class="content-section">
                <p style="margin: 8px 0;"><strong>URL:</strong> <a href="{url}" style="color: #2563eb;">{url}</a></p>
                <p style="margin: 8px 0;"><strong>Time:</strong> {time}</p>
                {status_section}
                {reason_section}
            </div>

            <div class="center">
                <a href="{monitor_url}" class="button">View Monitor Details</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                We'll notify you again when the monitor recovers.
            </p>
            {signature}"#,
        error_heading = "margin: 0 0 10px 0; color: #dc2626; font-size: 18px;",
        monitor_name = html_escape(monitor_name),
        url = html_escape(url),
        time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        status_section = status_section,
        reason_section = reason_section,
        monitor_url = monitor_url,
        signature = email_signature(),
    );

    wrap_html(&content)
}

fn build_down_alert_text(
    monitor_name: &str,
    url: &str,
    reason_message: &str,
    status_code: Option<u16>,
    monitor_url: &str,
) -> String {
    let mut text = format!(
        "MONITOR ALERT - DOWN\n\n\
        Monitor: {}\n\
        URL: {}\n\
        Time: {}\n\
        Reason: {}\n",
        monitor_name,
        url,
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        reason_message,
    );

    if let Some(code) = status_code {
        text.push_str(&format!("Status Code: {}\n", code));
    }

    text.push_str(&format!(
        "\nView monitor details: {}\n\n\
        We'll notify you again when the monitor recovers.",
        monitor_url,
    ));

    wrap_text(&text)
}

fn build_recovery_alert_html(
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

    let content = format!(
        r#"<h1>Monitor Recovered</h1>
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
            {signature}"#,
        success_heading = "margin: 0 0 10px 0; color: #059669; font-size: 18px;",
        monitor_name = html_escape(monitor_name),
        url = html_escape(url),
        time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        downtime_section = downtime_section,
        monitor_url = monitor_url,
        signature = email_signature(),
    );

    wrap_html(&content)
}

fn build_recovery_alert_text(
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
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
    );

    if let Some(duration) = downtime_duration {
        text.push_str(&format!("Downtime Duration: {}\n", format_duration(duration)));
    }

    text.push_str(&format!(
        "\nView monitor details: {}",
        monitor_url,
    ));

    wrap_text(&text)
}

fn build_ssl_alert_html(
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
            "🚨",
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

    let days_text = format_ssl_days_left(days_left);

    let content = format!(
        r#"<h1>SSL Certificate Alert</h1>
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
            {signature}"#,
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
    );

    wrap_html(&content)
}

fn build_ssl_alert_text(
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

    let days_text = format_ssl_days_left(days_left);

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
        View monitor details: {}",
        monitor_url,
    ));

    wrap_text(&text)
}

// --- Helper functions ---

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

/// Build the monitor dashboard URL.
fn build_monitor_url(public_base_url: &str, dashboard_id: &str, monitor_id: &str) -> String {
    format!("{}/dashboard/{}/monitoring/{}", public_base_url, dashboard_id, monitor_id)
}

/// Format SSL certificate days remaining for display.
fn format_ssl_days_left(days: i32) -> String {
    if days <= 0 {
        "Certificate has expired!".to_string()
    } else if days == 1 {
        "1 day remaining".to_string()
    } else {
        format!("{} days remaining", days)
    }
}