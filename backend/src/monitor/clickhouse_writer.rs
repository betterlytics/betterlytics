use std::sync::{Arc, Mutex};

use anyhow::Result;
use serde::Serialize;
use tokio::sync::{mpsc, oneshot};
use tracing::{info, warn};

use crate::clickhouse::ClickHouseClient;
use crate::monitor::MonitorResultRow;

enum Msg<R> {
    Rows(Vec<R>),
    /// Shutdown fence: acked once every batch enqueued before it is inserted.
    Flush(oneshot::Sender<()>),
}

/// Every live writer, registered at construction. Lets shutdown flush all writers
static FLUSH_REGISTRY: Mutex<Vec<FlushHandle>> = Mutex::new(Vec::new());

struct FlushHandle {
    table: String,
    request: Box<dyn Fn() -> Option<oneshot::Receiver<()>> + Send + Sync>,
    depth: Box<dyn Fn() -> Option<usize> + Send + Sync>,
}

fn register_writer<R: Send + 'static>(
    table: &str,
    sender: mpsc::WeakSender<Msg<R>>,
    capacity: usize,
) {
    let depth_sender = sender.clone();
    let request = Box::new(move || {
        let sender = sender.upgrade()?;
        let (ack_tx, ack_rx) = oneshot::channel();
        sender.try_send(Msg::Flush(ack_tx)).ok()?;
        Some(ack_rx)
    });
    let depth = Box::new(move || {
        let sender = depth_sender.upgrade()?;
        Some(capacity - sender.capacity())
    });
    FLUSH_REGISTRY.lock().unwrap().push(FlushHandle {
        table: table.to_string(),
        request,
        depth,
    });
}

/// Current queue depth of every live writer, for pipeline pressure metrics.
pub fn writer_queue_depths() -> Vec<(String, usize)> {
    FLUSH_REGISTRY
        .lock()
        .unwrap()
        .iter()
        .filter_map(|handle| (handle.depth)().map(|depth| (handle.table.clone(), depth)))
        .collect()
}

/// Sends a flush fence into every live writer, then waits for the acks: once
/// a writer acks, every batch enqueued into it before the fence is durable in
/// ClickHouse.
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
}

impl<R: clickhouse::Row + Serialize + Send + Sync + 'static> ClickhouseChannelWriter<R> {
    pub fn new(
        clickhouse: Arc<ClickHouseClient>,
        table: &str,
        channel_capacity: usize,
        batch_size: usize,
    ) -> Result<Arc<Self>> {
        let (sender, receiver) = mpsc::channel(channel_capacity);
        register_writer(table, sender.downgrade(), channel_capacity);
        let writer = Arc::new(Self { sender });

        Self::spawn_worker(clickhouse, table.to_string(), batch_size, receiver);

        Ok(writer)
    }

    pub fn enqueue_rows(&self, rows: Vec<R>) -> Result<()> {
        self.sender
            .try_send(Msg::Rows(rows))
            .map_err(|e| anyhow::anyhow!("enqueue_failed: {e}"))
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

#[cfg(test)]
mod tests {
    use super::*;
    use clickhouse::test::{handlers, Mock};
    use serde::Deserialize;
    use std::time::Duration;

    #[derive(clickhouse::Row, Serialize, Deserialize, Debug)]
    struct TestRow {
        n: u32,
    }

    /// The fence contract shutdown relies on: when a Flush marker is acked,
    /// every batch enqueued before it has been fully inserted.
    #[tokio::test]
    async fn flush_acks_only_after_prior_batches_are_inserted() {
        let mock = Mock::new();
        let first = mock.add(handlers::record());
        let second = mock.add(handlers::record());
        let client = clickhouse::Client::default().with_url(mock.url());
        let clickhouse = Arc::new(ClickHouseClient::from_client(client));

        let writer =
            ClickhouseChannelWriter::<TestRow>::new(clickhouse, "test.rows", 100, 500).unwrap();
        writer
            .enqueue_rows(vec![TestRow { n: 1 }, TestRow { n: 2 }])
            .unwrap();
        writer.enqueue_rows(vec![TestRow { n: 3 }]).unwrap();

        let (ack_tx, ack_rx) = oneshot::channel();
        writer.sender.try_send(Msg::Flush(ack_tx)).unwrap();

        tokio::time::timeout(Duration::from_secs(10), ack_rx)
            .await
            .expect("flush ack timed out")
            .expect("worker dropped the ack");

        let rows1: Vec<TestRow> = first.collect().await;
        let rows2: Vec<TestRow> = second.collect().await;
        let ns: Vec<u32> = rows1.iter().chain(rows2.iter()).map(|r| r.n).collect();
        assert_eq!(ns, vec![1, 2, 3]);
    }
}
