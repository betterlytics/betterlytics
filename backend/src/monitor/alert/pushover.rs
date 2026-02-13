use super::channel::{AlertMessage, AlertMessageDetails};
use super::email::format_duration;
use crate::email::templates::html_escape;

pub struct PushoverRequest {
    pub title: String,
    pub message: String,
    pub url: String,
    pub url_title: String,
    pub priority: i8,
}

fn truncate(s: &str, max_len: usize) -> String {
    let char_count = s.chars().count();
    if char_count <= max_len {
        s.to_string()
    } else {
        let truncated: String = s.chars().take(max_len.saturating_sub(1)).collect();
        format!("{}…", truncated)
    }
}

pub fn build_pushover_from_message(message: &AlertMessage) -> PushoverRequest {
    let (title, body, priority) = match &message.details {
        AlertMessageDetails::Down {
            reason_message,
            status_code,
        } => {
            let title = format!("Site Down: {}", truncate(&message.monitor_name, 50));
            let mut body = format!(
                "<b>{}</b> is unreachable.\n\nURL: {}\nReason: {}",
                html_escape(&message.monitor_name),
                html_escape(&message.url),
                html_escape(reason_message),
            );
            if let Some(code) = status_code {
                body.push_str(&format!("\nStatus: {}", code));
            }
            (title, body, 1)
        }
        AlertMessageDetails::Recovery { downtime_duration } => {
            let title = format!("Recovered: {}", truncate(&message.monitor_name, 50));
            let mut body = format!(
                "<b>{}</b> is back online.",
                html_escape(&message.monitor_name),
            );
            if let Some(d) = downtime_duration {
                body.push_str(&format!("\nDowntime: {}", format_duration(*d)));
            }
            (title, body, 0)
        }
        AlertMessageDetails::SslExpiring {
            days_left,
            expiry_date,
        } => {
            let title = format!("SSL Expiring: {}", truncate(&message.monitor_name, 50));
            let mut body = format!(
                "SSL certificate for <b>{}</b> expires in {} day{}.",
                html_escape(&message.monitor_name),
                days_left,
                if *days_left == 1 { "" } else { "s" },
            );
            if let Some(date) = expiry_date {
                body.push_str(&format!("\nExpiry: {}", date.format("%Y-%m-%d")));
            }
            (title, body, 0)
        }
        AlertMessageDetails::SslExpired {
            days_left: _,
            expiry_date: _,
        } => {
            let title = format!("SSL Expired: {}", truncate(&message.monitor_name, 50));
            let body = format!(
                "SSL certificate for <b>{}</b> has expired!",
                html_escape(&message.monitor_name),
            );
            (title, body, 1)
        }
    };

    PushoverRequest {
        title,
        message: body,
        url: message.monitor_url.clone(),
        url_title: "View Monitor".to_string(),
        priority,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;
    use crate::monitor::alert::channel::AlertMessageDetails;

    fn make_message(details: AlertMessageDetails) -> AlertMessage {
        AlertMessage {
            monitor_name: "Production API".to_string(),
            url: "https://api.example.com".to_string(),
            monitor_url: "https://app.example.com/dashboard/d1/monitoring/c1".to_string(),
            details,
        }
    }

    #[test]
    fn down_alert_has_high_priority() {
        let msg = make_message(AlertMessageDetails::Down {
            reason_message: "Connection refused".to_string(),
            status_code: Some(503),
        });
        let req = build_pushover_from_message(&msg);
        assert_eq!(req.priority, 1);
        assert!(req.title.contains("Down"));
        assert!(req.message.contains("503"));
        assert!(req.message.contains("Connection refused"));
    }

    #[test]
    fn recovery_alert_has_normal_priority() {
        let msg = make_message(AlertMessageDetails::Recovery {
            downtime_duration: Some(Duration::minutes(5)),
        });
        let req = build_pushover_from_message(&msg);
        assert_eq!(req.priority, 0);
        assert!(req.title.contains("Recovered"));
        assert!(req.message.contains("5 minutes"));
    }

    #[test]
    fn ssl_expiring_has_normal_priority() {
        let msg = make_message(AlertMessageDetails::SslExpiring {
            days_left: 7,
            expiry_date: None,
        });
        let req = build_pushover_from_message(&msg);
        assert_eq!(req.priority, 0);
        assert!(req.title.contains("SSL Expiring"));
        assert!(req.message.contains("7 days"));
    }

    #[test]
    fn ssl_expired_has_high_priority() {
        let msg = make_message(AlertMessageDetails::SslExpired {
            days_left: -1,
            expiry_date: None,
        });
        let req = build_pushover_from_message(&msg);
        assert_eq!(req.priority, 1);
        assert!(req.title.contains("SSL Expired"));
        assert!(req.message.contains("expired"));
    }

    #[test]
    fn long_monitor_name_is_truncated_in_title() {
        let msg = make_message(AlertMessageDetails::Down {
            reason_message: "Timeout".to_string(),
            status_code: None,
        });
        let long_name_msg = AlertMessage {
            monitor_name: "A".repeat(100),
            ..msg
        };
        let req = build_pushover_from_message(&long_name_msg);
        assert!(req.title.len() < 70);
    }

    #[test]
    fn monitor_url_is_set_in_request() {
        let msg = make_message(AlertMessageDetails::Recovery {
            downtime_duration: None,
        });
        let req = build_pushover_from_message(&msg);
        assert_eq!(req.url, "https://app.example.com/dashboard/d1/monitoring/c1");
        assert_eq!(req.url_title, "View Monitor");
    }

    #[test]
    fn html_special_chars_are_escaped_in_message() {
        let msg = AlertMessage {
            monitor_name: "<script>alert('xss')</script>".to_string(),
            url: "https://example.com".to_string(),
            monitor_url: "https://app.example.com/m/1".to_string(),
            details: AlertMessageDetails::Down {
                reason_message: "Error <br>".to_string(),
                status_code: None,
            },
        };
        let req = build_pushover_from_message(&msg);
        assert!(!req.message.contains("<script>"));
        assert!(req.message.contains("&lt;script&gt;"));
    }
}
