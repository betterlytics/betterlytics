//! Alert history storage using ClickHouse.
//!
//! Provides a channel-based writer for recording alert notifications to ClickHouse.

use std::sync::Arc;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::clickhouse_writer::ClickhouseChannelWriter;
use super::tracker::AlertType;

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
pub struct AlertHistoryRecord {
    pub monitor_check_id: String,
    pub site_id: String,
    pub alert_type: AlertType,
    pub sent_to: Vec<String>,
    pub status_code: Option<i32>,
    pub latency_ms: Option<i32>,
    pub ssl_days_left: Option<i32>,
}

impl AlertHistoryRecord {
    pub fn to_row(&self) -> AlertHistoryRow {
        AlertHistoryRow {
            ts: Utc::now(),
            check_id: self.monitor_check_id.clone(),
            site_id: self.site_id.clone(),
            alert_type: self.alert_type.as_str().to_string(),
            sent_to: self.sent_to.clone(),
            status_code: self.status_code,
            latency_ms: self.latency_ms,
            ssl_days_left: self.ssl_days_left,
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
