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
use crate::processing::ProcessedEvent;

mod models;
pub use models::{ActiveSessionRow, EventRow, ReferrerSourceCategoryRow, SessionReplayRow};

const EVENT_CHANNEL_CAPACITY: usize = 100_000;
const INSERTER_TIMEOUT_SECS: u64 = 5;
const INSERTER_PERIOD_SECS: u64 = 10;
const INSERTER_MAX_ROWS: u64 = 100_000;
const INSERTER_MAX_BYTES: u64 = 50 * 1024 * 1024;
const RETRY_BASE_BACKOFF_SECS: u64 = 1;
const RETRY_MAX_BACKOFF_SECS: u64 = 30;
const REJECTED_BATCH_ATTEMPTS: u32 = 3;

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
        metrics: Option<Arc<MetricsCollector>>,
    ) -> Result<(Self, Sender<ProcessedEvent>, JoinHandle<()>)> {
        let (event_tx, event_rx) = mpsc::channel(EVENT_CHANNEL_CAPACITY);

        let client = clickhouse.inner().clone();
        let inserter_handle = tokio::spawn(run_inserter(client, event_rx, metrics));

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
    metrics: Option<Arc<MetricsCollector>>,
) {
    info!("Inserter starting (owned-batch mode)");

    let period = Duration::from_secs(INSERTER_PERIOD_SECS);
    let mut batch: Vec<EventRow> = Vec::new();
    let mut batch_bytes: usize = 0;
    let mut flush_deadline = Instant::now() + period;

    loop {
        match timeout_at(flush_deadline, rx.recv()).await {
            Ok(Some(event)) => {
                let row = match EventRow::from_processed(event) {
                    Some(row) => row,
                    None => continue,
                };
                debug!(
                    site_id = %row.site_id,
                    visitor_id = %row.visitor_id,
                    session_id = %row.session_id,
                    event_type = ?row.event_type,
                    url = %row.url,
                    timestamp = %row.timestamp,
                    "Buffered row for ClickHouse insertion");
                batch_bytes += approx_row_bytes(&row);
                batch.push(row);

                if batch.len() as u64 >= INSERTER_MAX_ROWS || batch_bytes as u64 >= INSERTER_MAX_BYTES {
                    flush(&client, &mut batch, &mut batch_bytes, &metrics).await;
                    flush_deadline = Instant::now() + period;
                }
            }
            Ok(None) => {
                info!(rows = batch.len(), "Ingest channel closed, committing final batch");
                flush(&client, &mut batch, &mut batch_bytes, &metrics).await;
                info!("Inserter shutdown complete, final batch committed");
                return;
            }
            Err(_) => {
                flush(&client, &mut batch, &mut batch_bytes, &metrics).await;
                flush_deadline = Instant::now() + period;
            }
        }
    }
}

/// Inserts the whole batch as one INSERT and clears it only after ClickHouse
/// confirms. Transient failures (network, timeout, overload) retry forever
/// with capped backoff while the ingest channel buffers upstream; recognized
/// server rejections drop the batch after a few attempts so a poison batch
/// cannot block the pipeline forever.
///
/// Delivery is therefore at-least-once: a timeout after the server already
/// committed duplicates the batch on retry. Accepted trade-off (issue #19);
/// an insert_deduplication_token would make retries idempotent if the table
/// gains a non-replicated dedup window.
async fn flush(
    client: &clickhouse::Client,
    batch: &mut Vec<EventRow>,
    batch_bytes: &mut usize,
    metrics: &Option<Arc<MetricsCollector>>,
) {
    if batch.is_empty() {
        return;
    }

    let mut transient_attempts: u32 = 0;
    let mut rejected_attempts: u32 = 0;

    loop {
        match try_insert(client, batch).await {
            Ok(()) => {
                debug!(rows = batch.len(), "Committed batch to ClickHouse");
                batch.clear();
                *batch_bytes = 0;
                return;
            }
            Err(e) => match classify(&e) {
                ErrorClass::Transient => {
                    transient_attempts += 1;
                    let exp = transient_attempts.saturating_sub(1).min(5);
                    let backoff = Duration::from_secs(
                        (RETRY_BASE_BACKOFF_SECS << exp).min(RETRY_MAX_BACKOFF_SECS),
                    );
                    error!(
                        error = %e,
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
                            rows = batch.len(),
                            "ClickHouse rejected batch deterministically, dropping it"
                        );
                        if let Some(metrics) = metrics {
                            metrics.increment_events_dropped("insert_gave_up", batch.len() as u64);
                        }
                        batch.clear();
                        *batch_bytes = 0;
                        return;
                    }
                    warn!(
                        error = %e,
                        attempt = rejected_attempts,
                        "ClickHouse rejected batch, retrying"
                    );
                    tokio::time::sleep(Duration::from_secs(RETRY_BASE_BACKOFF_SECS)).await;
                }
            },
        }
    }
}

async fn try_insert(client: &clickhouse::Client, batch: &[EventRow]) -> Result<(), ClickHouseError> {
    let mut insert = client
        .insert("analytics.events")?
        .with_timeouts(Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)), None);
    for row in batch {
        insert.write(row).await?;
    }
    insert.end().await
}

enum ErrorClass {
    Transient,
    Deterministic,
}

/// Whether an insert error can plausibly succeed on retry. Only a recognized
/// ClickHouse rejection is treated as deterministic - when in doubt, retry.
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

/// Parses the leading "Code: NNN." from a ClickHouse exception message.
fn server_exception_code(response: &str) -> Option<u32> {
    let rest = response.trim_start().strip_prefix("Code: ")?;
    let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
    digits.parse().ok()
}

/// Approximate in-memory size of a row, used to bound batch memory between
/// flushes. Not the exact wire size; string fields dominate, so close enough.
fn approx_row_bytes(row: &EventRow) -> usize {
    const FIXED_FIELDS: usize = 128;
    FIXED_FIELDS
        + row.site_id.len()
        + row.domain.len()
        + row.url.len()
        + row.device_type.len()
        + row.country_code.len()
        + row.subdivision_code.len()
        + row.city.len()
        + row.browser.len()
        + row.browser_version.len()
        + row.os.len()
        + row.os_version.len()
        + row.referrer_source.len()
        + row.referrer_source_canonical.len()
        + row.referrer_source_name.len()
        + row.referrer_search_term.len()
        + row.referrer_url.len()
        + row.utm_source.len()
        + row.utm_medium.len()
        + row.utm_campaign.len()
        + row.utm_term.len()
        + row.utm_content.len()
        + row.custom_event_name.len()
        + row.custom_event_json.len()
        + row.outbound_link_url.len()
        + row.error_exceptions.len()
        + row.error_type.len()
        + row.error_message.len()
        + row.error_fingerprint.len()
        + row.global_properties_keys.iter().map(String::len).sum::<usize>()
        + row.global_properties_values.iter().map(String::len).sum::<usize>()
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
        let handle = tokio::spawn(run_inserter(client, rx, None));

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

    /// Transient failures must never kill the inserter: it holds the batch
    /// and keeps retrying until ClickHouse returns. (At shutdown, main's
    /// drain deadline caps the wait; the task itself never gives up.)
    #[tokio::test(start_paused = true)]
    async fn inserter_retries_forever_when_clickhouse_is_unreachable() {
        let client = clickhouse::Client::default().with_url("http://127.0.0.1:9");

        let (tx, rx) = mpsc::channel(100);
        let handle = tokio::spawn(run_inserter(client, rx, None));

        tx.send(test_event(0)).await.unwrap();
        drop(tx);

        // Ten virtual minutes of backoff-retries later, the task is still
        // alive and still trying - not dead like before issue #19.
        assert!(timeout(Duration::from_secs(600), handle).await.is_err());
    }
}