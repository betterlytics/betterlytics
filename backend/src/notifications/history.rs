use std::sync::Arc;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::clickhouse_writer::ClickhouseChannelWriter;

#[derive(clickhouse::Row, Serialize, Debug, Clone)]
pub struct NotificationHistoryRow {
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub ts: DateTime<Utc>,
    pub dashboard_id: String,
    pub integration_type: String,
    pub title: String,
    pub status: String,
    pub error_message: String,
}

const CHANNEL_CAPACITY: usize = 100;
const BATCH_SIZE: usize = 50;

pub type NotificationHistoryWriter = ClickhouseChannelWriter<NotificationHistoryRow>;

pub fn new_notification_history_writer(
    clickhouse: Arc<ClickHouseClient>,
    table: &str,
) -> Result<Arc<NotificationHistoryWriter>> {
    ClickhouseChannelWriter::new(clickhouse, table, CHANNEL_CAPACITY, BATCH_SIZE)
}
