use anyhow::Result;
use clickhouse::error::Error as ClickHouseError;
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::mpsc::{self, error::TryRecvError, Receiver, Sender};
use tokio::task::JoinHandle;
use tokio::time::timeout;

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
    /// Creates the database handle plus the ingest channel: events sent on the
    /// returned sender are batched into ClickHouse by a single inserter task.
    /// The returned handle completes once all senders are dropped and the
    /// inserter has committed its final batch — await it to drain on shutdown.
    pub async fn new(
        clickhouse: Arc<ClickHouseClient>,
        config: Arc<Config>,
    ) -> Result<(Self, Sender<ProcessedEvent>, JoinHandle<()>)> {
        let (event_tx, event_rx) = mpsc::channel(EVENT_CHANNEL_CAPACITY);

        let client = clickhouse.inner().clone();
        let inserter_handle = tokio::spawn(async move {
            if let Err(e) = run_inserter(client, event_rx).await {
                eprintln!("Inserter: Error - {}", e);
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
        
        println!("Validating database schema");
        let db_exists: u8 = self.clickhouse.inner()
            .query("SELECT count() FROM system.databases WHERE name = 'analytics'")
            .fetch_one()
            .await?;
        
        if db_exists == 0 {
            println!("[WARNING] Analytics database does not exist. Please run migrations.");
            return Ok(());
        }

        let table_exists: u8 = self.clickhouse.inner()
            .query("SELECT count() FROM system.tables WHERE database = 'analytics' AND name = 'events'")
            .fetch_one()
            .await?;

        if table_exists == 0 {
            println!("[WARNING] Events table does not exist. Please run migrations.");
            return Ok(());
        }

        if self.config.data_retention_days == -1 {
            println!("[INFO] Data retention explicitly disabled (data_retention_days = -1). Removing TTL if present.");
            if let Err(e) = Self::remove_data_retention_policy(self.clickhouse.inner()).await {
                eprintln!("[ERROR] Could not remove data retention policy: {}", e);
                return Err(e);
            }
        } else if self.config.data_retention_days > 0 {
            if let Err(e) = Self::apply_data_retention_policy(self.clickhouse.inner(), self.config.data_retention_days).await {
                eprintln!("[ERROR] Could not apply data retention policy: {}", e);
                return Err(e);
            }
        } else {
            println!(
                "[WARNING] Invalid value for DATA_RETENTION_DAYS: {}. TTL policy will not be changed. Use a positive integer to set TTL, or -1 to remove TTL.",
                self.config.data_retention_days
            );
        }

        println!("Database schema validation and TTL setup complete.");
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
            println!("[INFO] TTL policy exists, removing it.");
            let alter_query = "ALTER TABLE analytics.events REMOVE TTL";
            client
                .query(alter_query)
                .execute()
                .await
                .map_err(|e| anyhow::anyhow!("Failed to remove data retention policy: {}", e))?;
            println!("[INFO] TTL policy removed successfully.");
        } else {
            println!("[INFO] No TTL policy found on events table, nothing to remove.");
        }

        Ok(())
    }

    pub async fn check_connection(&self) -> Result<()> {
        println!("Checking database connection");
        self.clickhouse.inner().query("SELECT 1").execute().await?;
        println!("Database connection check successful");
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
    println!("Inserter: Starting (Sparse Stream Mode).");

    let mut inserter = client
        .inserter("analytics.events")?
        .with_timeouts(
            Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)),
            None,
        )
        .with_period(Some(Duration::from_secs(INSERTER_PERIOD_SECS)))
        .with_max_rows(INSERTER_MAX_ROWS)
        .with_max_bytes(INSERTER_MAX_BYTES);

    println!("Inserter: Configured.");

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
                        println!("Inserter: Channel closed during timeout wait. Committing final batch.");
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
                println!("Inserter: Channel disconnected. Committing final batch.");
                break;
            }
        };

        let row = match EventRow::from_processed(event) {
            Some(row) => row,
            None => continue,
        };

        tracing::debug!(
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
            eprintln!(
                "Inserter: Failed to write row to inserter buffer: {}. Row: {:?}",
                e, row
            );
            // TODO: Implement retry logic or dead-letter queue for inserter write failures.
            continue;
        }
    }

    println!("Inserter: Exiting loop. Finalizing inserter.");
    let stats = inserter.end().await?;
    println!("Inserter: Shutdown complete. Final stats: {:?}", stats);
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