use anyhow::Result;
use clickhouse::{error::Error as ClickHouseError, Client};
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::mpsc::{self, error::TryRecvError, Receiver};
use tokio::time::timeout;

use crate::config::Config;
use crate::processing::ProcessedEvent;

mod models;
pub use models::EventRow;

const NUM_INSERT_WORKERS: usize = 1;
const EVENT_CHANNEL_CAPACITY: usize = 100_000;
const WORKER_CHANNEL_CAPACITY: usize = 10_000;
const INSERTER_TIMEOUT_SECS: u64 = 5;
const INSERTER_PERIOD_SECS: u64 = 10;
const INSERTER_MAX_ROWS: u64 = 100_000;
const INSERTER_MAX_BYTES: u64 = 50 * 1024 * 1024;

pub struct Database {
    client: Client,
    event_tx: mpsc::Sender<ProcessedEvent>,
    config: Arc<Config>,
}

pub type SharedDatabase = Arc<Database>;

impl Database {
    pub async fn new(config: Arc<Config>) -> Result<Self> {
        let client = Self::create_client(config.clone()).await?;
        let (event_tx, event_rx) = Self::create_channels();
        let worker_senders = Self::spawn_inserter_workers(client.clone());
        Self::spawn_dispatcher(event_rx, worker_senders);

        Ok(Self { client, event_tx, config })
    }

    async fn create_client(config: Arc<Config>) -> Result<Client> {
        println!("Creating ClickHouse client with URL: {}", &config.clickhouse_url);
        let client = Client::default().with_user(&config.clickhouse_user).with_password(&config.clickhouse_password).with_url(&config.clickhouse_url);
        println!("ClickHouse client created successfully");
        Ok(client)
    }

    fn create_channels() -> (mpsc::Sender<ProcessedEvent>, mpsc::Receiver<ProcessedEvent>) {
        mpsc::channel(EVENT_CHANNEL_CAPACITY)
    }

    fn spawn_inserter_workers(client: Client) -> Vec<mpsc::Sender<ProcessedEvent>> {
        let mut worker_senders = Vec::with_capacity(NUM_INSERT_WORKERS);

        for i in 0..NUM_INSERT_WORKERS {
            let (worker_tx, worker_rx) = mpsc::channel(WORKER_CHANNEL_CAPACITY);
            worker_senders.push(worker_tx);
            let client_clone = client.clone();
            tokio::spawn(async move {
                if let Err(e) = run_inserter_worker(i, client_clone, worker_rx).await {
                    eprintln!("Worker {}: Error - {}", i, e);
                }
            });
        }
        worker_senders
    }

    fn spawn_dispatcher(
        mut event_rx: mpsc::Receiver<ProcessedEvent>,
        worker_senders: Vec<mpsc::Sender<ProcessedEvent>>,
    ) {
        tokio::spawn(async move {
            let mut worker_index = 0;
            while let Some(event) = event_rx.recv().await {
                if let Err(e) = worker_senders[worker_index].send(event).await {
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
        let db_exists: u8 = self.client
            .query("SELECT count() FROM system.databases WHERE name = 'analytics'")
            .fetch_one()
            .await?;
        
        if db_exists == 0 {
            println!("[WARNING] Analytics database does not exist. Please run migrations.");
            return Ok(());
        }

        let table_exists: u8 = self.client
            .query("SELECT count() FROM system.tables WHERE database = 'analytics' AND name = 'events'")
            .fetch_one()
            .await?;

        if table_exists == 0 {
            println!("[WARNING] Events table does not exist. Please run migrations.");
            return Ok(());
        }

        if self.config.data_retention_days == -1 {
            println!("[INFO] Data retention explicitly disabled (data_retention_days = -1). Removing TTL if present.");
            if let Err(e) = Self::remove_data_retention_policy(&self.client).await {
                eprintln!("[ERROR] Could not remove data retention policy: {}", e);
                return Err(e);
            }
        } else if self.config.data_retention_days > 0 {
            if let Err(e) = Self::apply_data_retention_policy(&self.client, self.config.data_retention_days).await {
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

    async fn apply_data_retention_policy(client: &Client, data_retention_days: i32) -> Result<()> {
        let alter_query = format!(
            "ALTER TABLE analytics.events MODIFY TTL timestamp + INTERVAL {} DAY",
            data_retention_days
        );
        client.query(&alter_query).execute().await.map_err(|e| 
            anyhow::anyhow!("Failed to apply data retention policy for analytics.events table: {}.", e)
        )?;
        Ok(())
    }

    async fn remove_data_retention_policy(client: &Client) -> Result<()> {
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

    pub async fn check_connection(&self) -> Result<()> {
        println!("Checking database connection");
        self.client.query("SELECT 1").execute().await?;
        println!("Database connection check successful");
        Ok(())
    }
}

async fn run_inserter_worker(
    worker_id: usize,
    client: Client,
    mut rx: Receiver<ProcessedEvent>,
) -> Result<(), ClickHouseError> {
    println!(
        "Worker {}: Starting (Inserter Sparse Stream Mode).",
        worker_id
    );

    let mut inserter = client
        .inserter("analytics.events")?
        .with_timeouts(
            Some(Duration::from_secs(INSERTER_TIMEOUT_SECS)),
            None,
        )
        .with_period(Some(Duration::from_secs(INSERTER_PERIOD_SECS)))
        .with_max_rows(INSERTER_MAX_ROWS)
        .with_max_bytes(INSERTER_MAX_BYTES);

    println!("Worker {}: Inserter configured.", worker_id);

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
                        println!(
                            "Worker {}: Channel closed during timeout wait. Committing final batch.",
                            worker_id
                        );
                        inserter.commit().await?;
                        break;
                    }
                    Err(_) => {
                        println!(
                            "Worker {}: Idle timeout reached. Committing potentially buffered data.",
                            worker_id
                        );
                        inserter.commit().await?;
                        continue;
                    }
                }
            }
            Err(TryRecvError::Disconnected) => {
                println!(
                    "Worker {}: Channel disconnected. Committing final batch.",
                    worker_id
                );
                break;
            }
        };

        let row = EventRow::from_processed(event);

        tracing::debug!(
            worker_id = worker_id, 
            site_id = %row.site_id, 
            visitor_id = %row.visitor_id,
            session_id = %row.session_id,
            url = %row.url, 
            timestamp = %row.timestamp, 
            device_type = %row.device_type,
            browser = %row.browser, 
            os = %row.os, 
            "Prepared row for ClickHouse insertion");
        if let Err(e) = inserter.write(&row) {
            eprintln!(
                "Worker {}: Failed to write row to inserter buffer: {}. Row: {:?}",
                worker_id, e, row
            );
            // TODO: Implement retry logic or dead-letter queue for inserter write failures.
            continue;
        }
    }

    println!(
        "Worker {}: Exiting loop. Finalizing inserter.",
        worker_id
    );
    let stats = inserter.end().await?;
    println!(
        "Worker {}: Shutdown complete. Final stats: {:?}",
        worker_id, stats
    );
    Ok(())
} 