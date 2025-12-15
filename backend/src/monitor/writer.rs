use std::sync::Arc;

use anyhow::Result;
use clickhouse::Client as ChClient;
use tokio::sync::mpsc;
use tracing::warn;

use crate::config::Config;
use crate::monitor::MonitorResultRow;

pub struct MonitorWriter {
    client: ChClient,
    table: String,
    sender: mpsc::Sender<Vec<MonitorResultRow>>,
}

impl MonitorWriter {
    pub fn new(config: Arc<Config>) -> Result<Arc<Self>> {
        let client = ChClient::default()
            .with_url(&config.clickhouse_url)
            .with_user(&config.clickhouse_user)
            .with_password(&config.clickhouse_password);

        let (sender, receiver) = mpsc::channel(MONITOR_CHANNEL_CAPACITY);
        let writer = Arc::new(Self {
            client,
            table: config.monitor_clickhouse_table.clone(),
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
            let mut inserter = self.client.inserter(&self.table)?;
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
}

const MONITOR_BATCH_SIZE: usize = 500;
const MONITOR_CHANNEL_CAPACITY: usize = 2_000;
