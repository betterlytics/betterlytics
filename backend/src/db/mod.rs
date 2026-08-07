use anyhow::Result;
use clickhouse::error::Error as ClickHouseError;
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::mpsc::{self, error::TryRecvError, Receiver};
use tokio::time::timeout;

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::processing::{BotEvent, ProcessedEvent};

mod models;
pub use models::{ActiveSessionRow, BotEventRow, EventRow, ReferrerSourceCategoryRow, SessionReplayRow};

const NUM_INSERT_WORKERS: usize = 1;
const EVENT_CHANNEL_CAPACITY: usize = 100_000;
const WORKER_CHANNEL_CAPACITY: usize = 10_000;
const BOT_CHANNEL_CAPACITY: usize = 10_000;
const INSERTER_TIMEOUT_SECS: u64 = 5;
const INSERTER_PERIOD_SECS: u64 = 10;
const INSERTER_MAX_ROWS: u64 = 100_000;
const INSERTER_MAX_BYTES: u64 = 50 * 1024 * 1024;

pub struct Database {
    clickhouse: Arc<ClickHouseClient>,
    event_tx: mpsc::Sender<ProcessedEvent>,
    bot_event_tx: mpsc::Sender<BotEventRow>,
    config: Arc<Config>,
}

pub type SharedDatabase = Arc<Database>;

impl Database {
    pub async fn new(clickhouse: Arc<ClickHouseClient>, config: Arc<Config>) -> Result<Self> {
        let (event_tx, event_rx) = Self::create_channels();
        let worker_senders = Self::spawn_inserter_workers(clickhouse.inner().clone());
        Self::spawn_dispatcher(event_rx, worker_senders);

        let (bot_event_tx, bot_event_rx) = mpsc::channel(BOT_CHANNEL_CAPACITY);
        let bot_client = clickhouse.inner().clone();
        tokio::spawn(async move {
            if let Err(e) = run_row_inserter_worker(bot_client, "analytics.bot_events", bot_event_rx).await {
                eprintln!("Bot event inserter: Error - {}", e);
            }
        });

        Ok(Self { clickhouse, event_tx, bot_event_tx, config })
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

    fn create_channels() -> (mpsc::Sender<ProcessedEvent>, mpsc::Receiver<ProcessedEvent>) {
        mpsc::channel(EVENT_CHANNEL_CAPACITY)
    }

    fn spawn_inserter_workers(client: clickhouse::Client) -> Vec<mpsc::Sender<EventRow>> {
        let mut worker_senders = Vec::with_capacity(NUM_INSERT_WORKERS);

        for i in 0..NUM_INSERT_WORKERS {
            let (worker_tx, worker_rx) = mpsc::channel(WORKER_CHANNEL_CAPACITY);
            worker_senders.push(worker_tx);
            let client_clone = client.clone();
            tokio::spawn(async move {
                if let Err(e) = run_row_inserter_worker(client_clone, "analytics.events", worker_rx).await {
                    eprintln!("Worker {}: Error - {}", i, e);
                }
            });
        }
        worker_senders
    }

    fn spawn_dispatcher(
        mut event_rx: mpsc::Receiver<ProcessedEvent>,
        worker_senders: Vec<mpsc::Sender<EventRow>>,
    ) {
        tokio::spawn(async move {
            let mut worker_index = 0;
            while let Some(event) = event_rx.recv().await {
                let row = EventRow::from_processed(event);
                if let Err(e) = worker_senders[worker_index].send(row).await {
                    eprintln!(
                        "Dispatcher failed to send event to worker {}: {}",
                        worker_index, e
                    );
                    // TODO: Add logic to handle potentially dead worker (e.g., skip, retry with backoff, remove worker from rotation).
                }
                worker_index = (worker_index + 1) % NUM_INSERT_WORKERS;
            }
            println!("Dispatcher: Event channel closed. Shutting down.");
        });
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

    pub async fn insert_event(&self, event: ProcessedEvent) -> Result<()> {
        self.event_tx.send(event).await?;
        Ok(())
    }

    pub async fn insert_bot_event(&self, event: BotEvent) -> Result<()> {
        self.bot_event_tx.send(BotEventRow::from_bot(event)).await?;
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

/// Batches rows into ClickHouse, committing on the inserter period even when the
/// channel is idle
async fn run_row_inserter_worker<R>(
    client: clickhouse::Client,
    table: &str,
    mut rx: Receiver<R>,
) -> Result<(), ClickHouseError>
where
    R: clickhouse::Row + serde::Serialize,
{
    let mut inserter = client
        .inserter(table)?
        .with_timeouts(Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)), None)
        .with_period(Some(Duration::from_secs(INSERTER_PERIOD_SECS)))
        .with_max_rows(INSERTER_MAX_ROWS)
        .with_max_bytes(INSERTER_MAX_BYTES);

    loop {
        let row = match rx.try_recv() {
            Ok(row) => row,
            Err(TryRecvError::Empty) => {
                let time_left = inserter
                    .time_left()
                    .unwrap_or_else(|| Duration::from_secs(INSERTER_PERIOD_SECS));

                match timeout(time_left, rx.recv()).await {
                    Ok(Some(row)) => row,
                    Ok(None) => {
                        inserter.commit().await?;
                        break;
                    }
                    Err(_) => {
                        inserter.commit().await?;
                        continue;
                    }
                }
            }
            Err(TryRecvError::Disconnected) => break,
        };

        if let Err(e) = inserter.write(&row) {
            eprintln!("Inserter for {}: Failed to write row: {}", table, e);
            continue;
        }
    }

    inserter.end().await?;
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