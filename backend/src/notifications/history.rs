use std::collections::HashSet;
use std::sync::Arc;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::clickhouse::ClickHouseClient;
use crate::monitor::clickhouse_writer::ClickhouseChannelWriter;

#[derive(clickhouse::Row, Serialize, Debug, Clone)]
pub struct NotificationHistoryRow {
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub ts: DateTime<Utc>,
    pub dashboard_id: String,
    pub event_key: String,
    pub integration_type: String,
    pub title: String,
    pub status: String,
    pub error_message: String,
}

#[derive(clickhouse::Row, Deserialize)]
struct EventKeySeedRow {
    event_key: String,
}

const CHANNEL_CAPACITY: usize = 100;
const BATCH_SIZE: usize = 50;
const NOTIFICATION_HISTORY_TABLE: &str = "analytics.notification_history";

pub type NotificationHistoryWriter = ClickhouseChannelWriter<NotificationHistoryRow>;

pub fn new_notification_history_writer(
    clickhouse: Arc<ClickHouseClient>,
    table: &str,
) -> Result<Arc<NotificationHistoryWriter>> {
    ClickhouseChannelWriter::new(clickhouse, table, CHANNEL_CAPACITY, BATCH_SIZE)
}

pub async fn load_recent_event_keys(
    clickhouse: &ClickHouseClient,
) -> Result<HashSet<String>, Box<dyn std::error::Error + Send + Sync>> {
    let query = format!(
        r#"
        SELECT DISTINCT event_key
        FROM {table}
        WHERE status = 'sent'
          AND event_key != ''
          AND ts > now() - INTERVAL 30 DAY
        "#,
        table = NOTIFICATION_HISTORY_TABLE
    );

    let rows: Vec<EventKeySeedRow> = clickhouse.inner().query(&query).fetch_all().await?;
    Ok(rows.into_iter().map(|r| r.event_key).collect())
}
