use async_trait::async_trait;
use chrono::{DateTime, Duration, Utc};

#[derive(Debug, Clone)]
pub enum AlertMessageDetails {
    Down {
        reason_message: String,
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

#[derive(Debug, Clone)]
pub struct AlertMessage {
    pub monitor_name: String,
    pub url: String,
    pub monitor_url: String,
    pub details: AlertMessageDetails,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ChannelType {
    Email,
    Pushover,
}

impl ChannelType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ChannelType::Email => "email",
            ChannelType::Pushover => "pushover",
        }
    }
}

impl std::fmt::Display for ChannelType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[async_trait]
pub trait AlertChannel: Send + Sync + 'static {
    fn channel_type(&self) -> ChannelType;
    async fn send(
        &self,
        message: &AlertMessage,
        recipients: &[String],
    ) -> Result<(), anyhow::Error>;
}
