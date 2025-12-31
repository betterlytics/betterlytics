use std::sync::Arc;

use anyhow::Result;
use serde::Serialize;
use tokio::sync::mpsc;
use tracing::warn;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::MonitorResultRow;

/// Generic channel-based writer for ClickHouse rows.
/// This provides a non-blocking `enqueue_rows` method that sends batches
/// to a background worker for insertion
pub struct ClickhouseChannelWriter<R: clickhouse::Row + Serialize + Send + Sync + 'static> {
    sender: mpsc::Sender<Vec<R>>,
    capacity: usize,
}

impl<R: clickhouse::Row + Serialize + Send + Sync + 'static> ClickhouseChannelWriter<R> {
    pub fn new(
        clickhouse: Arc<ClickHouseClient>,
        table: &str,
        channel_capacity: usize,
        batch_size: usize,
    ) -> Result<Arc<Self>> {
        let (sender, receiver) = mpsc::channel(channel_capacity);
        let writer = Arc::new(Self {
            sender,
            capacity: channel_capacity,
        });

        Self::spawn_worker(clickhouse, table.to_string(), batch_size, receiver);

        Ok(writer)
    }

    pub fn enqueue_rows(&self, rows: Vec<R>) -> Result<()> {
        self.sender
            .try_send(rows)
            .map_err(|e| anyhow::anyhow!("enqueue_failed: {e}"))
    }

    pub fn queue_depth(&self) -> usize {
        self.capacity - self.sender.capacity()
    }

    fn spawn_worker(
        clickhouse: Arc<ClickHouseClient>,
        table: String,
        batch_size: usize,
        mut receiver: mpsc::Receiver<Vec<R>>,
    ) {
        tokio::spawn(async move {
            while let Some(batch) = receiver.recv().await {
                if let Err(err) = Self::insert_rows(&clickhouse, &table, batch, batch_size).await {
                    warn!(table = %table, error = ?err, "Failed to insert rows");
                }
            }
        });
    }

    async fn insert_rows(
        clickhouse: &ClickHouseClient,
        table: &str,
        rows: Vec<R>,
        batch_size: usize,
    ) -> Result<()> {
        for chunk in rows.chunks(batch_size) {
            let mut inserter = clickhouse.inner().inserter(table)?;
            for row in chunk {
                inserter.write(row)?;
            }
            inserter.end().await?;
        }
        Ok(())
    }
}

const MONITOR_BATCH_SIZE: usize = 500;
const MONITOR_CHANNEL_CAPACITY: usize = 2_000;

pub type MonitorWriter = ClickhouseChannelWriter<MonitorResultRow>;

pub fn new_monitor_writer(
    clickhouse: Arc<ClickHouseClient>,
    table: &str,
) -> Result<Arc<MonitorWriter>> {
    ClickhouseChannelWriter::new(clickhouse, table, MONITOR_CHANNEL_CAPACITY, MONITOR_BATCH_SIZE)
}
