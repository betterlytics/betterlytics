use std::sync::{Arc, Mutex};

use anyhow::Result;
use serde::Serialize;
use tokio::sync::{mpsc, oneshot};
use tracing::{info, warn};

use crate::clickhouse::ClickHouseClient;
use crate::monitor::MonitorResultRow;

/// Message consumed by a writer's background worker.
enum Msg<R> {
    Rows(Vec<R>),
    /// Shutdown fence: acked once every batch enqueued before it is inserted.
    Flush(oneshot::Sender<()>),
}

/// Every live writer, registered at construction. Lets shutdown flush all
/// writers without threading handles through each subsystem's init (the
/// monitor writers are created inside a detached retry loop main can't reach).
static FLUSH_REGISTRY: Mutex<Vec<FlushHandle>> = Mutex::new(Vec::new());

struct FlushHandle {
    table: String,
    request: Box<dyn Fn() -> Option<oneshot::Receiver<()>> + Send + Sync>,
}

fn register_for_shutdown_flush<R: Send + 'static>(table: &str, sender: mpsc::WeakSender<Msg<R>>) {
    let request = Box::new(move || {
        let sender = sender.upgrade()?;
        let (ack_tx, ack_rx) = oneshot::channel();
        sender.try_send(Msg::Flush(ack_tx)).ok()?;
        Some(ack_rx)
    });
    FLUSH_REGISTRY.lock().unwrap().push(FlushHandle {
        table: table.to_string(),
        request,
    });
}

/// Sends a flush fence into every live writer, then waits for the acks: once
/// a writer acks, every batch enqueued into it before the fence is durable in
/// ClickHouse. Called during graceful shutdown; the caller bounds the wait.
pub async fn flush_all_writers() {
    let pending: Vec<(String, oneshot::Receiver<()>)> = FLUSH_REGISTRY
        .lock()
        .unwrap()
        .iter()
        .filter_map(|handle| (handle.request)().map(|rx| (handle.table.clone(), rx)))
        .collect();

    for (table, ack) in pending {
        match ack.await {
            Ok(()) => info!(table = %table, "Writer flushed"),
            Err(_) => warn!(table = %table, "Writer exited before acking flush"),
        }
    }
}

/// Generic channel-based writer for ClickHouse rows.
/// This provides a non-blocking `enqueue_rows` method that sends batches
/// to a background worker for insertion
pub struct ClickhouseChannelWriter<R: clickhouse::Row + Serialize + Send + Sync + 'static> {
    sender: mpsc::Sender<Msg<R>>,
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
        register_for_shutdown_flush(table, sender.downgrade());
        let writer = Arc::new(Self {
            sender,
            capacity: channel_capacity,
        });

        Self::spawn_worker(clickhouse, table.to_string(), batch_size, receiver);

        Ok(writer)
    }

    pub fn enqueue_rows(&self, rows: Vec<R>) -> Result<()> {
        self.sender
            .try_send(Msg::Rows(rows))
            .map_err(|e| anyhow::anyhow!("enqueue_failed: {e}"))
    }

    pub fn queue_depth(&self) -> usize {
        self.capacity - self.sender.capacity()
    }

    fn spawn_worker(
        clickhouse: Arc<ClickHouseClient>,
        table: String,
        batch_size: usize,
        mut receiver: mpsc::Receiver<Msg<R>>,
    ) {
        tokio::spawn(async move {
            while let Some(msg) = receiver.recv().await {
                match msg {
                    Msg::Rows(batch) => {
                        if let Err(err) =
                            Self::insert_rows(&clickhouse, &table, batch, batch_size).await
                        {
                            warn!(table = %table, error = ?err, "Failed to insert rows");
                        }
                    }
                    Msg::Flush(ack) => {
                        let _ = ack.send(());
                    }
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
