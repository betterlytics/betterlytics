use anyhow::Result;
use clickhouse::error::Error as ClickHouseError;
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::mpsc::{self, error::TryRecvError, Receiver, Sender};
use tokio::task::JoinHandle;
use tokio::time::timeout;
use tracing::{debug, error, info, warn};

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::processing::ProcessedEvent;

mod models;
pub use models::{ActiveSessionRow, EventRow, ReferrerSourceCategoryRow, SessionReplayRow};

const EVENT_CHANNEL_CAPACITY: usize = 100_000;
const INSERTER_TIMEOUT_SECS: u64 = 5;
const INSERTER_PERIOD_SECS: u64 = 10;
const INSERTER_MAX_ROWS: u64 = 100_000;
const INSERTER_MAX_BYTES: u64 = 50 * 1024 * 1024;

pub struct Database {
    clickhouse: Arc<ClickHouseClient>,
    config: Arc<Config>,
}

pub type SharedDatabase = Arc<Database>;

impl Database {
    /// Creates the database handle plus the ingest channel
    pub async fn new(
        clickhouse: Arc<ClickHouseClient>,
        config: Arc<Config>,
    ) -> Result<(Self, Sender<ProcessedEvent>, JoinHandle<()>)> {
        let (event_tx, event_rx) = mpsc::channel(EVENT_CHANNEL_CAPACITY);

        let client = clickhouse.inner().clone();
        let inserter_handle = tokio::spawn(async move {
            if let Err(e) = run_inserter(client, event_rx).await {
                error!("Inserter task failed: {}", e);
            }
        });

        Ok((Self { clickhouse, config }, event_tx, inserter_handle))
    }

    /// Fetch the current session of every visitor active within `window`, from `analytics.sessions`
    pub async fn fetch_active_sessions(&self, window: Duration) -> Result<Vec<ActiveSessionRow>> {
        let rows = self
            .clickhouse
            .inner()
            .query(&active_sessions_query(window))
            .fetch_all::<ActiveSessionRow>()
            .await?;
        Ok(rows)
    }

    pub async fn validate_schema(&self) -> Result<()> {
        self.check_connection().await?;
        
        info!("Validating database schema");
        let db_exists: u8 = self.clickhouse.inner()
            .query("SELECT count() FROM system.databases WHERE name = 'analytics'")
            .fetch_one()
            .await?;

        if db_exists == 0 {
            warn!("Analytics database does not exist. Please run migrations.");
            return Ok(());
        }

        let table_exists: u8 = self.clickhouse.inner()
            .query("SELECT count() FROM system.tables WHERE database = 'analytics' AND name = 'events'")
            .fetch_one()
            .await?;

        if table_exists == 0 {
            warn!("Events table does not exist. Please run migrations.");
            return Ok(());
        }

        if self.config.data_retention_days == -1 {
            info!("Data retention explicitly disabled (data_retention_days = -1). Removing TTL if present.");
            if let Err(e) = Self::remove_data_retention_policy(self.clickhouse.inner()).await {
                error!("Could not remove data retention policy: {}", e);
                return Err(e);
            }
        } else if self.config.data_retention_days > 0 {
            if let Err(e) = Self::apply_data_retention_policy(self.clickhouse.inner(), self.config.data_retention_days).await {
                error!("Could not apply data retention policy: {}", e);
                return Err(e);
            }
        } else {
            warn!(
                "Invalid value for DATA_RETENTION_DAYS: {}. TTL policy will not be changed. Use a positive integer to set TTL, or -1 to remove TTL.",
                self.config.data_retention_days
            );
        }

        info!("Database schema validation and TTL setup complete.");
        Ok(())
    }

    async fn apply_data_retention_policy(client: &clickhouse::Client, data_retention_days: i32) -> Result<()> {
        let alter_query = format!(
            "ALTER TABLE analytics.events MODIFY TTL timestamp + INTERVAL {} DAY",
            data_retention_days
        );
        client.query(&alter_query).execute().await.map_err(|e| 
            anyhow::anyhow!("Failed to apply data retention policy for analytics.events table: {}.", e)
        )?;
        Ok(())
    }

    async fn remove_data_retention_policy(client: &clickhouse::Client) -> Result<()> {
        let create_table_query: String = client
            .query("SELECT create_table_query FROM system.tables WHERE database = 'analytics' AND name = 'events'")
            .fetch_one()
            .await?;

        if create_table_query.contains("TTL ") {
            info!("TTL policy exists, removing it.");
            let alter_query = "ALTER TABLE analytics.events REMOVE TTL";
            client
                .query(alter_query)
                .execute()
                .await
                .map_err(|e| anyhow::anyhow!("Failed to remove data retention policy: {}", e))?;
            info!("TTL policy removed successfully.");
        } else {
            info!("No TTL policy found on events table, nothing to remove.");
        }

        Ok(())
    }

    pub async fn check_connection(&self) -> Result<()> {
        debug!("Checking database connection");
        self.clickhouse.inner().query("SELECT 1").execute().await?;
        debug!("Database connection check successful");
        Ok(())
    }

    pub async fn referrer_dictionary_ready(&self) -> Result<bool> {
        let table_exists: u8 = self.clickhouse.inner()
            .query("SELECT count() FROM system.tables WHERE database = 'analytics' AND name = 'referrer_source_categories'")
            .fetch_one()
            .await?;

        let dictionary_exists: u8 = self.clickhouse.inner()
            .query("SELECT count() FROM system.tables WHERE database = 'analytics' AND name = 'referrer_source_categories_dict' AND engine = 'Dictionary'")
            .fetch_one()
            .await?;

        Ok(table_exists != 0 && dictionary_exists != 0)
    }

    pub async fn write_referrer_categories(
        &self,
        rows: Vec<ReferrerSourceCategoryRow>,
    ) -> Result<()> {
        let mut inserter = self
            .clickhouse
            .inner()
            .inserter("analytics.referrer_source_categories")?
            .with_max_rows(100_000);

        for row in rows {
            inserter.write(&row)?;
        }

        inserter.end().await?;
        self.clickhouse
            .inner()
            .query("SYSTEM RELOAD DICTIONARY analytics.referrer_source_categories_dict")
            .execute()
            .await?;

        Ok(())
    }

    pub async fn upsert_session_replay(&self, row: SessionReplayRow) -> Result<()> {
        let mut inserter = self.clickhouse.inner().inserter("analytics.session_replays")?;
        inserter.write(&row)?;
        inserter.end().await?;
        Ok(())
    }
}

async fn run_inserter(
    client: clickhouse::Client,
    mut rx: Receiver<ProcessedEvent>,
) -> Result<(), ClickHouseError> {
    info!("Inserter starting (sparse stream mode)");

    let mut inserter = client
        .inserter("analytics.events")?
        .with_timeouts(
            Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)),
            None,
        )
        .with_period(Some(Duration::from_secs(INSERTER_PERIOD_SECS)))
        .with_max_rows(INSERTER_MAX_ROWS)
        .with_max_bytes(INSERTER_MAX_BYTES);

    debug!("Inserter configured");

    loop {
        let event = match rx.try_recv() {
            Ok(received_event) => received_event,
            Err(TryRecvError::Empty) => {
                // Channel empty, wait for the next event or until the inserter period ends.
                let time_left = inserter
                    .time_left()
                    .unwrap_or_else(|| Duration::from_secs(INSERTER_PERIOD_SECS));

                match timeout(time_left, rx.recv()).await {
                    Ok(Some(received_event)) => received_event,
                    Ok(None) => {
                        info!("Ingest channel closed, committing final batch");
                        inserter.commit().await?;
                        break;
                    }
                    Err(_) => {
                        inserter.commit().await?;
                        continue;
                    }
                }
            }
            Err(TryRecvError::Disconnected) => {
                info!("Ingest channel disconnected, committing final batch");
                break;
            }
        };

        let row = match EventRow::from_processed(event) {
            Some(row) => row,
            None => continue,
        };

        debug!(
            site_id = %row.site_id,
            visitor_id = %row.visitor_id,
            session_id = %row.session_id,
            event_type = ?row.event_type,
            custom_event_name = ?row.custom_event_name,
            url = %row.url,
            timestamp = %row.timestamp,
            device_type = %row.device_type,
            browser = %row.browser,
            os = %row.os,
            "Prepared row for ClickHouse insertion");
        if let Err(e) = inserter.write(&row) {
            error!("Failed to write row to inserter buffer: {}. Row: {:?}", e, row);
            // TODO: Implement retry logic or dead-letter queue for inserter write failures.
            continue;
        }
    }

    let stats = inserter.end().await?;
    info!(stats = ?stats, "Inserter shutdown complete, final batch committed");
    Ok(())
}

/// SQL to load each active visitor's most recent session. Filtering on `session_end` uses the
/// `idx_session_end` minmax skip index, so the cost is bounded by the number of *active*
/// sessions, not total history; `argMax(.., session_end)` picks each visitor's current session.
fn active_sessions_query(window: Duration) -> String {
    let window_secs = window.as_secs();
    format!(
        "SELECT site_id, toUInt64(visitor_id) AS visitor_id, \
                argMax(session_id, session_end) AS session_id, \
                argMax(session_created_at, session_end) AS session_created_at \
         FROM analytics.sessions \
         WHERE session_end > now() - toIntervalSecond({window_secs}) \
         GROUP BY site_id, visitor_id"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::analytics::{AnalyticsEvent, RawTrackingEvent};
    use crate::campaign::CampaignInfo;
    use crate::referrer::ReferrerInfo;
    use clickhouse::test::{handlers, Mock};

    fn test_event(n: u64) -> ProcessedEvent {
        let raw = RawTrackingEvent {
            site_id: "test-site".to_string(),
            event_name: "pageview".to_string(),
            is_custom_event: false,
            properties: String::new(),
            url: format!("https://example.com/page-{n}"),
            referrer: None,
            user_agent: "test-agent".to_string(),
            screen_resolution: "1920x1080".to_string(),
            timestamp: 1_700_000_000,
            outbound_link_url: None,
            cwv_cls: None,
            cwv_lcp: None,
            cwv_inp: None,
            cwv_fcp: None,
            cwv_ttfb: None,
            scroll_depth_percentage: None,
            scroll_depth_pixels: None,
            error_exceptions: None,
            global_properties: None,
            page_duration_seconds: None,
        };

        ProcessedEvent {
            event: AnalyticsEvent::new(raw, "127.0.0.1".to_string()),
            event_type: "pageview".to_string(),
            session_id: n,
            session_created_at: chrono::Utc::now(),
            country_code: None,
            subdivision_code: None,
            city: None,
            browser: None,
            browser_version: None,
            os: None,
            os_version: None,
            device_type: None,
            site_id: "test-site".to_string(),
            visitor_fingerprint: n,
            timestamp: chrono::Utc::now(),
            domain: Some("example.com".to_string()),
            url: format!("/page-{n}"),
            referrer_info: ReferrerInfo::default(),
            user_agent: "test-agent".to_string(),
            campaign_info: CampaignInfo::default(),
            custom_event_name: String::new(),
            custom_event_json: String::new(),
            outbound_link_url: String::new(),
            cwv_cls: None,
            cwv_lcp: None,
            cwv_inp: None,
            cwv_fcp: None,
            cwv_ttfb: None,
            scroll_depth_percentage: None,
            scroll_depth_pixels: None,
            error_exceptions: String::new(),
            error_type: String::new(),
            error_message: String::new(),
            error_fingerprint: String::new(),
            global_properties_keys: Vec::new(),
            global_properties_values: Vec::new(),
            page_duration_seconds: 0,
        }
    }

    /// The drain contract main relies on at shutdown: once all senders drop,
    /// the inserter commits everything buffered and its task completes.
    #[tokio::test]
    async fn inserter_commits_buffered_events_when_channel_closes() {
        let mock = Mock::new();
        let recording = mock.add(handlers::record());
        let client = clickhouse::Client::default().with_url(mock.url());

        let (tx, rx) = mpsc::channel(100);
        let handle = tokio::spawn(run_inserter(client, rx));

        for n in 0..5 {
            tx.send(test_event(n)).await.unwrap();
        }
        drop(tx);

        timeout(Duration::from_secs(10), handle)
            .await
            .expect("inserter did not exit after channel close")
            .expect("inserter task panicked")
            .expect("inserter returned an error");

        let rows: Vec<EventRow> = recording.collect().await;
        assert_eq!(rows.len(), 5);
        assert!(rows.iter().all(|r| r.site_id == "test-site"));
    }

    /// The deadline-safety property: an unreachable ClickHouse must never
    /// leave the drain hanging - the task finishes (with an error) promptly.
    #[tokio::test]
    async fn inserter_exits_when_clickhouse_is_unreachable() {
        let client = clickhouse::Client::default().with_url("http://127.0.0.1:9");

        let (tx, rx) = mpsc::channel(100);
        let handle = tokio::spawn(run_inserter(client, rx));

        tx.send(test_event(0)).await.unwrap();
        drop(tx);

        timeout(Duration::from_secs(10), handle)
            .await
            .expect("inserter did not exit after channel close")
            .expect("inserter task panicked")
            .ok();
    }
}