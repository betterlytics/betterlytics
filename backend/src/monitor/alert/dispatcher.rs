use std::collections::HashMap;
use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use tracing::{error, info};

use super::channel::{AlertChannel, AlertMessage, AlertMessageDetails, ChannelType};
use super::repository::{AlertDetails, AlertHistoryRecord, AlertHistoryWriter};
use crate::monitor::ReasonCode;

pub struct NotificationEngineConfig {
    pub channels: Vec<Box<dyn AlertChannel>>,
    pub public_base_url: String,
}

impl std::fmt::Debug for NotificationEngineConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NotificationEngineConfig")
            .field("channel_count", &self.channels.len())
            .field("public_base_url", &self.public_base_url)
            .finish()
    }
}

#[derive(Debug, Clone)]
pub enum NotificationEvent {
    MonitorDown {
        reason_code: ReasonCode,
        status_code: Option<u16>,
    },
    MonitorRecovery {
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

impl NotificationEvent {
    pub fn as_str(&self) -> &'static str {
        match self {
            NotificationEvent::MonitorDown { .. } => "down",
            NotificationEvent::MonitorRecovery { .. } => "recovery",
            NotificationEvent::SslExpiring { .. } => "ssl_expiring",
            NotificationEvent::SslExpired { .. } => "ssl_expired",
        }
    }

    pub fn build_message(
        &self,
        monitor_name: &str,
        url: &str,
        monitor_url: &str,
    ) -> AlertMessage {
        let details = match self {
            NotificationEvent::MonitorDown {
                reason_code,
                status_code,
            } => AlertMessageDetails::Down {
                reason_message: reason_code.to_message().to_string(),
                status_code: *status_code,
            },
            NotificationEvent::MonitorRecovery { downtime_duration } => {
                AlertMessageDetails::Recovery {
                    downtime_duration: *downtime_duration,
                }
            }
            NotificationEvent::SslExpiring {
                days_left,
                expiry_date,
            } => AlertMessageDetails::SslExpiring {
                days_left: *days_left,
                expiry_date: *expiry_date,
            },
            NotificationEvent::SslExpired {
                days_left,
                expiry_date,
            } => AlertMessageDetails::SslExpired {
                days_left: *days_left,
                expiry_date: *expiry_date,
            },
        };

        AlertMessage {
            monitor_name: monitor_name.to_string(),
            url: url.to_string(),
            monitor_url: monitor_url.to_string(),
            details,
        }
    }

    fn build_history_details(&self) -> AlertDetails {
        match self {
            NotificationEvent::MonitorDown { status_code, .. } => AlertDetails::Down {
                status_code: status_code.map(|c| c as i32),
            },
            NotificationEvent::MonitorRecovery { .. } => AlertDetails::Recovery,
            NotificationEvent::SslExpiring { days_left, .. } => {
                AlertDetails::SslExpiring { days_left: *days_left }
            }
            NotificationEvent::SslExpired { days_left, .. } => {
                AlertDetails::SslExpired { days_left: *days_left }
            }
        }
    }
}

impl std::fmt::Display for NotificationEvent {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

pub struct Notification {
    pub check_id: String,
    pub site_id: String,
    pub dashboard_id: String,
    pub monitor_name: String,
    pub url: String,
    pub recipients: HashMap<ChannelType, Vec<String>>,
    pub event: NotificationEvent,
}

pub struct NotificationEngine {
    channels: Vec<Box<dyn AlertChannel>>,
    history_writer: Option<Arc<AlertHistoryWriter>>,
    public_base_url: String,
}

impl std::fmt::Debug for NotificationEngine {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NotificationEngine")
            .field("channel_count", &self.channels.len())
            .field("has_history_writer", &self.history_writer.is_some())
            .finish()
    }
}

impl NotificationEngine {
    pub fn new(
        config: NotificationEngineConfig,
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
        skip(self, notification),
        fields(check_id = %notification.check_id, event = %notification.event)
    )]
    pub async fn notify(&self, notification: Notification) -> bool {
        if self.channels.is_empty() {
            info!(
                event = %notification.event.as_str(),
                "Would send notification (no channels configured)"
            );
            return false;
        }

        let monitor_url = build_monitor_url(
            &self.public_base_url,
            &notification.dashboard_id,
            &notification.check_id,
        );
        let message = notification.event.build_message(
            &notification.monitor_name,
            &notification.url,
            &monitor_url,
        );
        let mut any_sent = false;

        for channel in &self.channels {
            let recipients = match notification.recipients.get(&channel.channel_type()) {
                Some(r) if !r.is_empty() => r,
                _ => continue,
            };

            match channel.send(&message, recipients).await {
                Ok(()) => {
                    let record = AlertHistoryRecord::new(
                        &notification.check_id,
                        &notification.site_id,
                        channel.channel_type().as_str(),
                        recipients,
                        notification.event.build_history_details(),
                    );
                    self.record_alert_history(record);
                    any_sent = true;
                }
                Err(e) => {
                    error!(
                        channel = %channel.channel_type(),
                        error = ?e,
                        "Failed to send notification"
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
