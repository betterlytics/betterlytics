use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use tracing::{error, info};

use super::channel::{AlertChannel, AlertMessage, AlertMessageDetails, ChannelType};
use super::repository::{AlertDetails, AlertHistoryRecord, AlertHistoryWriter};
use crate::monitor::ReasonCode;

pub struct AlertDispatcherConfig {
    pub channels: Vec<Box<dyn AlertChannel>>,
    pub public_base_url: String,
}

impl std::fmt::Debug for AlertDispatcherConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AlertDispatcherConfig")
            .field("channel_count", &self.channels.len())
            .field("public_base_url", &self.public_base_url)
            .finish()
    }
}

pub struct AlertContext<'a> {
    pub check_id: &'a str,
    pub site_id: &'a str,
    pub dashboard_id: &'a str,
    pub monitor_name: &'a str,
    pub url: &'a str,
    pub recipients: &'a [String],
}

impl<'a> AlertContext<'a> {
    /// Returns the recipients for a given channel type.
    /// Currently all channels share the same recipients list (email addresses).
    /// When per-channel routing is needed (e.g. Pushover user keys), this method
    /// should be extended with additional fields on AlertContext per channel type.
    pub fn recipients_for(&self, channel_type: ChannelType) -> &[String] {
        match channel_type {
            ChannelType::Email => self.recipients,
        }
    }
}

#[derive(Debug, Clone)]
pub enum Alert {
    Down {
        reason_code: ReasonCode,
        status_code: Option<u16>,
    },
    Recovery {
        downtime_duration: Option<Duration>,
    },
    SslExpiring {
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
    },
    SslExpired {
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
    },
}

impl Alert {
    pub fn as_str(&self) -> &'static str {
        match self {
            Alert::Down { .. } => "down",
            Alert::Recovery { .. } => "recovery",
            Alert::SslExpiring { .. } => "ssl_expiring",
            Alert::SslExpired { .. } => "ssl_expired",
        }
    }

    pub fn build_message(&self, ctx: &AlertContext, base_url: &str) -> AlertMessage {
        let monitor_url = build_monitor_url(base_url, ctx.dashboard_id, ctx.check_id);

        let details = match self {
            Alert::Down {
                reason_code,
                status_code,
            } => AlertMessageDetails::Down {
                reason_message: reason_code.to_message().to_string(),
                status_code: *status_code,
            },
            Alert::Recovery { downtime_duration } => AlertMessageDetails::Recovery {
                downtime_duration: *downtime_duration,
            },
            Alert::SslExpiring {
                days_left,
                expiry_date,
            } => AlertMessageDetails::SslExpiring {
                days_left: *days_left,
                expiry_date: *expiry_date,
            },
            Alert::SslExpired {
                days_left,
                expiry_date,
            } => AlertMessageDetails::SslExpired {
                days_left: *days_left,
                expiry_date: *expiry_date,
            },
        };

        AlertMessage {
            monitor_name: ctx.monitor_name.to_string(),
            url: ctx.url.to_string(),
            monitor_url,
            details,
        }
    }

    fn build_history_record(
        &self,
        ctx: &AlertContext,
        channel: &str,
        recipients: &[String],
    ) -> AlertHistoryRecord {
        let details = match self {
            Alert::Down { status_code, .. } => AlertDetails::Down {
                status_code: status_code.map(|c| c as i32),
            },
            Alert::Recovery { .. } => AlertDetails::Recovery,
            Alert::SslExpiring { days_left, .. } => {
                AlertDetails::SslExpiring { days_left: *days_left }
            }
            Alert::SslExpired { days_left, .. } => {
                AlertDetails::SslExpired { days_left: *days_left }
            }
        };
        AlertHistoryRecord::new(ctx, channel, recipients, details)
    }
}

pub struct AlertDispatcher {
    channels: Vec<Box<dyn AlertChannel>>,
    history_writer: Option<Arc<AlertHistoryWriter>>,
    public_base_url: String,
}

impl std::fmt::Debug for AlertDispatcher {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AlertDispatcher")
            .field("channel_count", &self.channels.len())
            .field("has_history_writer", &self.history_writer.is_some())
            .finish()
    }
}

impl AlertDispatcher {
    pub fn new(
        config: AlertDispatcherConfig,
        history_writer: Option<Arc<AlertHistoryWriter>>,
    ) -> Self {
        Self {
            channels: config.channels,
            history_writer,
            public_base_url: config.public_base_url,
        }
    }

    pub fn has_channels(&self) -> bool {
        !self.channels.is_empty()
    }

    pub fn channel_count(&self) -> usize {
        self.channels.len()
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx, alert),
        fields(check_id = %ctx.check_id)
    )]
    pub async fn dispatch(&self, ctx: AlertContext<'_>, alert: Alert) -> bool {
        if self.channels.is_empty() {
            info!(
                recipients = ctx.recipients.len(),
                alert_type = %alert.as_str(),
                "Would send alert (no alert channels configured)"
            );
            return false;
        }

        let message = alert.build_message(&ctx, &self.public_base_url);
        let mut any_sent = false;

        for channel in &self.channels {
            let recipients = ctx.recipients_for(channel.channel_type());
            if recipients.is_empty() {
                continue;
            }

            match channel.send(&message, recipients).await {
                Ok(()) => {
                    let record = alert.build_history_record(
                        &ctx,
                        channel.channel_type().as_str(),
                        recipients,
                    );
                    self.record_alert_history(record);
                    any_sent = true;
                }
                Err(e) => {
                    error!(
                        channel = %channel.channel_type(),
                        error = ?e,
                        "Failed to send alert"
                    );
                }
            }
        }

        any_sent
    }

    fn record_alert_history(&self, record: AlertHistoryRecord) {
        if let Some(ref writer) = self.history_writer {
            let row = record.to_row();
            if let Err(e) = writer.enqueue_rows(vec![row]) {
                error!(
                    monitor_check_id = %record.monitor_check_id,
                    details = ?record.details,
                    error = ?e,
                    "Failed to record alert history"
                );
            }
        }
    }
}

fn build_monitor_url(public_base_url: &str, dashboard_id: &str, monitor_id: &str) -> String {
    format!(
        "{}/dashboard/{}/monitoring/{}",
        public_base_url, dashboard_id, monitor_id
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::monitor::ReasonCode;

    struct TestFixture {
        recipients: Vec<String>,
        check_id: String,
        site_id: String,
        dashboard_id: String,
        monitor_name: String,
        url: String,
    }

    impl TestFixture {
        fn new() -> Self {
            Self {
                recipients: vec!["test@example.com".to_string()],
                check_id: "check-1".to_string(),
                site_id: "site-1".to_string(),
                dashboard_id: "dash-1".to_string(),
                monitor_name: "My Monitor".to_string(),
                url: "https://example.com".to_string(),
            }
        }

        fn context(&self) -> AlertContext<'_> {
            AlertContext {
                check_id: &self.check_id,
                site_id: &self.site_id,
                dashboard_id: &self.dashboard_id,
                monitor_name: &self.monitor_name,
                url: &self.url,
                recipients: &self.recipients,
            }
        }
    }

    #[test]
    fn build_message_down_maps_fields_correctly() {
        let f = TestFixture::new();
        let alert = Alert::Down {
            reason_code: ReasonCode::Http5xx,
            status_code: Some(503),
        };

        let msg = alert.build_message(&f.context(), "https://app.example.com");

        assert_eq!(msg.monitor_name, "My Monitor");
        assert_eq!(msg.url, "https://example.com");
        assert_eq!(
            msg.monitor_url,
            "https://app.example.com/dashboard/dash-1/monitoring/check-1"
        );
        match &msg.details {
            AlertMessageDetails::Down {
                reason_message,
                status_code,
            } => {
                assert!(!reason_message.is_empty());
                assert_eq!(*status_code, Some(503));
            }
            _ => panic!("Expected Down details"),
        }
    }

    #[test]
    fn build_message_recovery_maps_fields_correctly() {
        let f = TestFixture::new();
        let alert = Alert::Recovery {
            downtime_duration: Some(Duration::minutes(5)),
        };

        let msg = alert.build_message(&f.context(), "https://app.example.com");

        match &msg.details {
            AlertMessageDetails::Recovery { downtime_duration } => {
                assert_eq!(*downtime_duration, Some(Duration::minutes(5)));
            }
            _ => panic!("Expected Recovery details"),
        }
    }

    #[test]
    fn build_message_ssl_expiring_maps_fields_correctly() {
        let f = TestFixture::new();
        let alert = Alert::SslExpiring {
            days_left: 7,
            expiry_date: None,
        };

        let msg = alert.build_message(&f.context(), "https://app.example.com");

        match &msg.details {
            AlertMessageDetails::SslExpiring {
                days_left,
                expiry_date,
            } => {
                assert_eq!(*days_left, 7);
                assert!(expiry_date.is_none());
            }
            _ => panic!("Expected SslExpiring details"),
        }
    }

    #[test]
    fn build_message_ssl_expired_maps_fields_correctly() {
        let f = TestFixture::new();
        let alert = Alert::SslExpired {
            days_left: -2,
            expiry_date: None,
        };

        let msg = alert.build_message(&f.context(), "https://app.example.com");

        match &msg.details {
            AlertMessageDetails::SslExpired {
                days_left,
                expiry_date,
            } => {
                assert_eq!(*days_left, -2);
                assert!(expiry_date.is_none());
            }
            _ => panic!("Expected SslExpired details"),
        }
    }

    #[test]
    fn recipients_for_email_returns_recipients() {
        let recipients = vec!["a@b.com".to_string(), "c@d.com".to_string()];
        let ctx = AlertContext {
            check_id: "c",
            site_id: "s",
            dashboard_id: "d",
            monitor_name: "m",
            url: "u",
            recipients: &recipients,
        };

        assert_eq!(ctx.recipients_for(ChannelType::Email), &recipients);
    }
}
