use std::sync::Arc;

use anyhow::Result;
use tokio::sync::mpsc;
use tracing::warn;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::MonitorResultRow;

pub struct MonitorWriter {
    clickhouse: Arc<ClickHouseClient>,
    table: String,
    sender: mpsc::Sender<Vec<MonitorResultRow>>,
}

impl MonitorWriter {
    pub fn new(clickhouse: Arc<ClickHouseClient>, table: &str) -> Result<Arc<Self>> {
        let (sender, receiver) = mpsc::channel(MONITOR_CHANNEL_CAPACITY);
        let writer = Arc::new(Self {
            clickhouse,
            table: table.to_string(),
            sender,
        });
        writer.spawn_worker(receiver);
        Ok(writer)
    }

    /// Enqueue rows for asynchronous insertion. Drops and errors if the channel is full to avoid
    /// blocking probe execution.
    pub fn enqueue_rows(&self, rows: Vec<MonitorResultRow>) -> Result<()> {
        self.sender
            .try_send(rows)
            .map_err(|e| anyhow::anyhow!("enqueue_failed: {e}"))
    }

    async fn insert_rows(&self, rows: Vec<MonitorResultRow>) -> Result<()> {
        for chunk in rows.chunks(MONITOR_BATCH_SIZE) {
            let mut inserter = self.clickhouse.inner().inserter(&self.table)?;
            for row in chunk {
                inserter.write(row)?;
            }
            inserter.end().await?;
        }
        Ok(())
    }

    fn spawn_worker(self: &Arc<Self>, mut receiver: mpsc::Receiver<Vec<MonitorResultRow>>) {
        let this = Arc::clone(self);
        tokio::spawn(async move {
            while let Some(batch) = receiver.recv().await {
                if let Err(err) = this.insert_rows(batch).await {
                    warn!(error = ?err, "Failed to insert monitor rows");
                }
            }
        });
    }

    pub fn queue_depth(&self) -> usize {
        MONITOR_CHANNEL_CAPACITY - self.sender.capacity()
    }
}

const MONITOR_BATCH_SIZE: usize = 500;
const MONITOR_CHANNEL_CAPACITY: usize = 2_000;
