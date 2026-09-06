use anyhow::Result;
use clickhouse::error::Error as ClickHouseError;
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::mpsc::{self, Receiver, Sender};
use tokio::task::JoinHandle;
use tokio::time::{timeout_at, Instant};
use tracing::{debug, error, info, warn};

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::metrics::MetricsCollector;
use crate::processing::{BotEvent, ProcessedEvent};

mod models;
pub use models::{ActiveSessionRow, BotEventRow, EventRow, ReferrerSourceCategoryRow, SessionReplayMetaRow, SessionReplayRow, SessionReplaySegmentRow};

const EVENT_CHANNEL_CAPACITY: usize = 100_000;
const BOT_CHANNEL_CAPACITY: usize = 10_000;
const INSERTER_TIMEOUT_SECS: u64 = 5;
/// Cap on awaiting the insert acknowledgement, so a black-hole connection
/// surfaces as a retryable timeout instead of hanging the flush.
const INSERTER_END_TIMEOUT_SECS: u64 = 10;
const INSERTER_PERIOD_SECS: u64 = 10;
/// Flush when the batch reaches this many rows. Sized so even validation's
/// worst-case event (~30 KB of properties + error payload) keeps a batch
/// around ~60 MB; typical events (~0.5 KB) make ~1 MB batches. Revisit if
/// validation's payload size caps change.
const INSERTER_MAX_ROWS: usize = 2_000;
const RETRY_BASE_BACKOFF_SECS: u64 = 1;
const RETRY_MAX_BACKOFF_SECS: u64 = 30;
const REJECTED_BATCH_ATTEMPTS: u32 = 3;

pub struct Database {
    clickhouse: Arc<ClickHouseClient>,
    config: Arc<Config>,
}

pub type SharedDatabase = Arc<Database>;

impl Database {
    /// Creates the database handle plus the event and bot-event ingest channels
    pub async fn new(
        clickhouse: Arc<ClickHouseClient>,
        config: Arc<Config>,
        metrics: Option<Arc<MetricsCollector>>,
    ) -> Result<(Self, Sender<ProcessedEvent>, Sender<BotEvent>, JoinHandle<()>, JoinHandle<()>)> {
        let (event_tx, event_rx) = mpsc::channel(EVENT_CHANNEL_CAPACITY);
        let (bot_event_tx, bot_event_rx) = mpsc::channel(BOT_CHANNEL_CAPACITY);

        let client = clickhouse.inner().clone();
        let inserter_handle = tokio::spawn(run_inserter(
            client.clone(),
            "analytics.events",
            event_rx,
            EventRow::from_processed,
            metrics.clone(),
        ));
        let bot_inserter_handle = tokio::spawn(run_inserter(
            client,
            "analytics.bot_events",
            bot_event_rx,
            |event: BotEvent| Some(BotEventRow::from_bot(event)),
            metrics,
        ));

        Ok((Self { clickhouse, config }, event_tx, bot_event_tx, inserter_handle, bot_inserter_handle))
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

    fn async_insert_client(&self) -> clickhouse::Client {
        self.clickhouse
            .inner()
            .clone()
            .with_option("async_insert", "1")
            .with_option("wait_for_async_insert", "1")
    }

    async fn insert_one<R>(&self, table: &str, row: &R) -> Result<()>
    where
        R: clickhouse::Row + serde::Serialize,
    {
        let mut inserter = self.async_insert_client()
            .inserter(table)?
            .with_timeouts(
                Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)),
                Some(Duration::from_secs(INSERTER_END_TIMEOUT_SECS)),
            );
        inserter.write(row)?;
        inserter.end().await?;
        Ok(())
    }

    pub async fn upsert_session_replay(&self, row: SessionReplayRow) -> Result<()> {
        self.insert_one("analytics.session_replays", &row).await
    }

    pub async fn fetch_session_replay_meta(&self, site_id: &str, session_id: u64) -> Result<Option<SessionReplayMetaRow>> {
        let fetch = self.clickhouse.inner()
            .query(
                "WITH (ended_at, size_bytes, event_count) AS v
                SELECT argMax(started_at, v), max(ended_at), argMax(size_bytes, v), argMax(start_url, v), argMax(event_count, v), argMax(visitor_id, v),
                argMax(client_started_at_ms, v), argMax(client_ended_at_ms, v),
                argMax(error_fingerprints, v), argMax(recorded_error_count, v)
                FROM analytics.session_replays WHERE site_id = ? AND session_id = ? GROUP BY site_id, session_id",
            )
            .bind(site_id)
            .bind(session_id)
            .fetch_all::<SessionReplayMetaRow>();
        let rows = tokio::time::timeout(Duration::from_secs(INSERTER_TIMEOUT_SECS), fetch)
            .await
            .map_err(|_| anyhow::anyhow!("replay meta fetch timed out"))??;
        Ok(rows.into_iter().next())
    }

    pub async fn replay_segment_exists(&self, site_id: &str, session_id: u64, filename: &str) -> Result<bool> {
        let fetch = self.clickhouse.inner()
            .query("SELECT count() FROM analytics.session_replay_segments WHERE site_id = ? AND session_id = ? AND filename = ?")
            .bind(site_id)
            .bind(session_id)
            .bind(filename)
            .fetch_one::<u64>();
        let n = tokio::time::timeout(Duration::from_secs(INSERTER_TIMEOUT_SECS), fetch)
            .await
            .map_err(|_| anyhow::anyhow!("replay segment exists check timed out"))??;
        Ok(n > 0)
    }

    pub async fn insert_replay_segment(&self, row: SessionReplaySegmentRow) -> Result<()> {
        self.insert_one("analytics.session_replay_segments", &row).await
    }
}

async fn run_inserter<T, R>(
    client: clickhouse::Client,
    table: &'static str,
    mut rx: Receiver<T>,
    convert: fn(T) -> Option<R>,
    metrics: Option<Arc<MetricsCollector>>,
) where
    T: Send,
    R: clickhouse::Row + serde::Serialize,
{
    info!(table, "Inserter starting (owned-batch mode)");

    let period = Duration::from_secs(INSERTER_PERIOD_SECS);
    let mut batch: Vec<R> = Vec::new();
    let mut flush_deadline = Instant::now() + period;

    loop {
        match timeout_at(flush_deadline, rx.recv()).await {
            Ok(Some(event)) => {
                let row = match convert(event) {
                    Some(row) => row,
                    None => continue,
                };
                batch.push(row);
                if let Some(metrics) = &metrics {
                    metrics.set_inserter_batch_rows(table, batch.len());
                }

                if batch.len() >= INSERTER_MAX_ROWS {
                    flush(&client, table, &mut batch, &metrics).await;
                    flush_deadline = Instant::now() + period;
                }
            }
            Ok(None) => {
                info!(table, rows = batch.len(), "Ingest channel closed, committing final batch");
                flush(&client, table, &mut batch, &metrics).await;
                info!(table, "Inserter shutdown complete, final batch committed");
                return;
            }
            Err(_) => {
                flush(&client, table, &mut batch, &metrics).await;
                flush_deadline = Instant::now() + period;
            }
        }
    }
}

/// Clears the batch only once ClickHouse confirms it. Transient failures retry
/// forever (the channel buffers upstream); recognized rejections drop the batch
/// after a few attempts so a poison batch cannot block the pipeline. All
/// attempts share one dedup token, so a re-sent batch is ignored server-side.
async fn flush<R>(
    client: &clickhouse::Client,
    table: &'static str,
    batch: &mut Vec<R>,
    metrics: &Option<Arc<MetricsCollector>>,
) where
    R: clickhouse::Row + serde::Serialize,
{
    if batch.is_empty() {
        return;
    }

    let dedup_token = uuid::Uuid::new_v4().to_string();

    let mut transient_attempts: u32 = 0;
    let mut rejected_attempts: u32 = 0;

    loop {
        match try_insert(client, table, batch, &dedup_token).await {
            Ok(()) => {
                debug!(table, rows = batch.len(), "Committed batch to ClickHouse");
                if let Some(metrics) = metrics {
                    metrics.increment_events_inserted(table, batch.len() as u64);
                    metrics.set_inserter_retry_attempts(table, 0);
                    metrics.set_inserter_batch_rows(table, 0);
                }
                batch.clear();
                return;
            }
            Err(e) => match classify(&e) {
                ErrorClass::Transient => {
                    transient_attempts += 1;
                    if let Some(metrics) = metrics {
                        metrics.set_inserter_retry_attempts(table, transient_attempts);
                    }
                    let exp = transient_attempts.saturating_sub(1).min(5);
                    let backoff = Duration::from_secs(
                        (RETRY_BASE_BACKOFF_SECS << exp).min(RETRY_MAX_BACKOFF_SECS),
                    );
                    error!(
                        error = %e,
                        table,
                        attempt = transient_attempts,
                        backoff_secs = backoff.as_secs(),
                        rows = batch.len(),
                        "Transient ClickHouse insert failure, retrying batch"
                    );
                    tokio::time::sleep(backoff).await;
                }
                ErrorClass::Deterministic => {
                    rejected_attempts += 1;
                    if rejected_attempts >= REJECTED_BATCH_ATTEMPTS {
                        error!(
                            error = %e,
                            table,
                            rows = batch.len(),
                            "ClickHouse rejected batch deterministically, dropping it"
                        );
                        if let Some(metrics) = metrics {
                            metrics.increment_events_dropped("insert_gave_up", table, batch.len() as u64);
                            metrics.set_inserter_retry_attempts(table, 0);
                            metrics.set_inserter_batch_rows(table, 0);
                        }
                        batch.clear();
                        return;
                    }
                    warn!(
                        error = %e,
                        table,
                        attempt = rejected_attempts,
                        "ClickHouse rejected batch, retrying"
                    );
                    tokio::time::sleep(Duration::from_secs(RETRY_BASE_BACKOFF_SECS)).await;
                }
            },
        }
    }
}

async fn try_insert<R>(
    client: &clickhouse::Client,
    table: &'static str,
    batch: &[R],
    dedup_token: &str,
) -> Result<(), ClickHouseError>
where
    R: clickhouse::Row + serde::Serialize,
{
    let mut insert = client
        .clone()
        .with_option("insert_deduplication_token", dedup_token)
        .insert(table)?
        .with_timeouts(
            Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)),
            Some(Duration::from_secs(INSERTER_END_TIMEOUT_SECS)),
        );
    for row in batch {
        insert.write(row).await?;
    }
    insert.end().await
}

enum ErrorClass {
    Transient,
    Deterministic,
}

fn classify(error: &ClickHouseError) -> ErrorClass {
    match error {
        ClickHouseError::Network(_) | ClickHouseError::TimedOut => ErrorClass::Transient,
        ClickHouseError::BadResponse(response) => match server_exception_code(response) {
            // Capacity/availability conditions that clear on their own:
            // 159 TIMEOUT_EXCEEDED, 202 TOO_MANY_SIMULTANEOUS_QUERIES,
            // 209 SOCKET_TIMEOUT, 210 NETWORK_ERROR, 241 MEMORY_LIMIT_EXCEEDED,
            // 242 TABLE_IS_READ_ONLY, 252 TOO_MANY_PARTS
            Some(159 | 202 | 209 | 210 | 241 | 242 | 252) => ErrorClass::Transient,
            // Any other exception code rejects these exact bytes every time.
            Some(_) => ErrorClass::Deterministic,
            // Unparseable body (proxy mangling, truncation): retryable.
            None => ErrorClass::Transient,
        },
        // Client-side serialization/params errors reproduce on every attempt.
        _ => ErrorClass::Deterministic,
    }
}

fn server_exception_code(response: &str) -> Option<u32> {
    let rest = response.trim_start().strip_prefix("Code: ")?;
    let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
    digits.parse().ok()
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
    use tokio::time::timeout;

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
            timestamp: Some(1_700_000_000),
            automation: false,
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
            event: AnalyticsEvent::new(raw, "127.0.0.1".to_string(), "test-agent".to_string(), String::new(), false),
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
            asn: 0,
            asn_org: String::new(),
        }
    }

    fn spawn_event_inserter(
        client: clickhouse::Client,
        rx: Receiver<ProcessedEvent>,
    ) -> JoinHandle<()> {
        tokio::spawn(run_inserter(
            client,
            "analytics.events",
            rx,
            EventRow::from_processed,
            None,
        ))
    }

    /// The drain contract main relies on at shutdown: once all senders drop,
    /// the inserter commits everything buffered and its task completes.
    #[tokio::test]
    async fn inserter_commits_buffered_events_when_channel_closes() {
        let mock = Mock::new();
        let recording = mock.add(handlers::record());
        let client = clickhouse::Client::default().with_url(mock.url());

        let (tx, rx) = mpsc::channel(100);
        let handle = spawn_event_inserter(client, rx);

        for n in 0..5 {
            tx.send(test_event(n)).await.unwrap();
        }
        drop(tx);

        timeout(Duration::from_secs(10), handle)
            .await
            .expect("inserter did not exit after channel close")
            .expect("inserter task panicked");

        let rows: Vec<EventRow> = recording.collect().await;
        assert_eq!(rows.len(), 5);
        assert!(rows.iter().all(|r| r.site_id == "test-site"));
    }

    #[tokio::test(start_paused = true)]
    async fn inserter_retries_forever_when_clickhouse_is_unreachable() {
        let client = clickhouse::Client::default().with_url("http://127.0.0.1:9");

        let (tx, rx) = mpsc::channel(100);
        let handle = spawn_event_inserter(client, rx);

        tx.send(test_event(0)).await.unwrap();
        drop(tx);

        // Still retrying ten virtual minutes later: the timeout is the pass.
        assert!(timeout(Duration::from_secs(600), handle).await.is_err());
    }

    #[tokio::test(start_paused = true)]
    async fn transient_failure_then_recovery_loses_no_events() {
        let mock = Mock::new();
        mock.add(handlers::failure(http::StatusCode::INTERNAL_SERVER_ERROR));
        let recording = mock.add(handlers::record());
        let client = clickhouse::Client::default().with_url(mock.url());

        let (tx, rx) = mpsc::channel(100);
        let handle = spawn_event_inserter(client, rx);

        for n in 0..3 {
            tx.send(test_event(n)).await.unwrap();
        }
        drop(tx);

        timeout(Duration::from_secs(120), handle)
            .await
            .expect("inserter did not recover from transient failure")
            .expect("inserter task panicked");

        let rows: Vec<EventRow> = recording.collect().await;
        assert_eq!(rows.len(), 3);
    }

    #[tokio::test(start_paused = true)]
    async fn poison_batch_is_dropped_and_does_not_block_later_batches() {
        let mock = Mock::new();
        let recording = mock.add(handlers::record());
        let client = clickhouse::Client::default().with_url(mock.url());

        let (tx, rx) = mpsc::channel(100);
        let handle = spawn_event_inserter(client, rx);

        // Timestamp beyond DateTime's u32 range: serializing this row fails
        // deterministically, poisoning its whole batch.
        let mut poison = test_event(0);
        poison.timestamp = chrono::DateTime::from_timestamp(5_000_000_000, 0).unwrap();
        tx.send(poison).await.unwrap();

        // Long enough for the flush period plus every rejected attempt.
        tokio::time::sleep(Duration::from_secs(30)).await;

        tx.send(test_event(1)).await.unwrap();
        drop(tx);

        timeout(Duration::from_secs(120), handle)
            .await
            .expect("inserter blocked on poison batch")
            .expect("inserter task panicked");

        let rows: Vec<EventRow> = recording.collect().await;
        assert_eq!(rows.len(), 1, "only the healthy row should be inserted");
        assert_eq!(rows[0].session_id, 1);
    }
}
