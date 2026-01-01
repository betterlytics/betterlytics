use std::sync::Arc;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::clickhouse_writer::ClickhouseChannelWriter;


#[derive(clickhouse::Row, Serialize, Debug, Clone)]
pub struct AlertHistoryRow {
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub ts: DateTime<Utc>,
    pub check_id: String,
    pub site_id: String,
    pub alert_type: String,
    pub sent_to: Vec<String>,
    pub status_code: Option<i32>,
    pub latency_ms: Option<i32>,
    pub ssl_days_left: Option<i32>,
}

#[derive(Clone, Debug)]
pub enum AlertDetails {
    Down { status_code: Option<i32> },
    Recovery,
    SslExpiring { days_left: i32 },
    SslExpired { days_left: i32 },
}

impl AlertDetails {
    pub fn as_str(&self) -> &'static str {
        match self {
            AlertDetails::Down { .. } => "down",
            AlertDetails::Recovery => "recovery",
            AlertDetails::SslExpiring { .. } => "ssl_expiring",
            AlertDetails::SslExpired { .. } => "ssl_expired",
        }
    }
}

#[derive(Clone, Debug)]
pub struct AlertHistoryRecord {
    pub monitor_check_id: String,
    pub site_id: String,
    pub sent_to: Vec<String>,
    pub details: AlertDetails,
}

impl AlertHistoryRecord {
    pub fn from_context(ctx: &super::dispatcher::AlertContext, details: AlertDetails) -> Self {
        Self {
            monitor_check_id: ctx.check_id.to_string(),
            site_id: ctx.site_id.to_string(),
            sent_to: ctx.recipients.to_vec(),
            details,
        }
    }

    pub fn to_row(&self) -> AlertHistoryRow {
        let (status_code, ssl_days_left) = match &self.details {
            AlertDetails::Down { status_code } => (*status_code, None),
            AlertDetails::Recovery => (None, None),
            AlertDetails::SslExpiring { days_left }
            | AlertDetails::SslExpired { days_left } => (None, Some(*days_left)),
        };

        AlertHistoryRow {
            ts: Utc::now(),
            check_id: self.monitor_check_id.clone(),
            site_id: self.site_id.clone(),
            alert_type: self.details.as_str().to_string(),
            sent_to: self.sent_to.clone(),
            status_code,
            latency_ms: None,
            ssl_days_left,
        }
    }
}

const ALERT_HISTORY_CHANNEL_CAPACITY: usize = 100;
const ALERT_HISTORY_BATCH_SIZE: usize = 50;

pub type AlertHistoryWriter = ClickhouseChannelWriter<AlertHistoryRow>;

pub fn new_alert_history_writer(
    clickhouse: Arc<ClickHouseClient>,
    table: &str,
) -> Result<Arc<AlertHistoryWriter>> {
    ClickhouseChannelWriter::new(
        clickhouse,
        table,
        ALERT_HISTORY_CHANNEL_CAPACITY,
        ALERT_HISTORY_BATCH_SIZE,
    )
}
