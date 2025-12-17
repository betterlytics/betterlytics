use std::sync::Arc;

use anyhow::Result;
use chrono::{DateTime, Utc};
use clickhouse::Client as ChClient;
use serde::Serialize;
use tokio::sync::mpsc;
use tracing::warn;

use crate::config::Config;
use crate::monitor::alert::tracker::{IncidentState, IncidentSeverity, IncidentSnapshot};
use crate::monitor::models::MonitorCheck;

#[derive(clickhouse::Row, Serialize, Debug, Clone)]
pub struct MonitorIncidentRow {
    pub incident_id: String,
    pub check_id: String,
    pub site_id: String,
    pub state: String,
    pub severity: String,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub started_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub last_event_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub resolved_at: Option<DateTime<Utc>>,
    pub open_reason_code: Option<String>,
    pub close_reason_code: Option<String>,
    pub failure_count: u16,
    pub flap_count: u16,
    pub last_status: Option<String>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_down_at: Option<DateTime<Utc>>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_flap_at: Option<DateTime<Utc>>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_resolve_at: Option<DateTime<Utc>>,
    pub extra: String,
}

impl MonitorIncidentRow {
    pub fn from_snapshot(
        snapshot: &IncidentSnapshot,
        check: &MonitorCheck,
        notified: NotificationSnapshot,
        open_reason_code: Option<String>,
        close_reason_code: Option<String>,
        extra: serde_json::Value,
    ) -> Self {
        Self {
            incident_id: snapshot
                .incident_id
                .expect("snapshot must have incident_id when stored")
                .to_string(),
            check_id: check.id.clone(),
            site_id: check.site_id.clone(),
            state: snapshot.state.as_str().to_string(),
            severity: snapshot.severity.as_str().to_string(),
            started_at: snapshot.started_at.unwrap_or_else(Utc::now),
            last_event_at: snapshot.last_event_at.unwrap_or_else(Utc::now),
            resolved_at: snapshot.resolved_at,
            open_reason_code,
            close_reason_code,
            failure_count: snapshot.failure_count,
            flap_count: snapshot.flap_count,
            last_status: snapshot.last_status.map(|s| s.as_str().to_string()),
            notified_down_at: notified.last_down,
            notified_flap_at: notified.last_flap,
            notified_resolve_at: notified.last_recovery,
            extra: extra.to_string(),
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct NotificationSnapshot {
    pub last_down: Option<DateTime<Utc>>,
    pub last_recovery: Option<DateTime<Utc>>,
    pub last_flap: Option<DateTime<Utc>>,
}

pub struct IncidentStore {
    client: ChClient,
    table: String,
    sender: mpsc::Sender<Vec<MonitorIncidentRow>>,
}

impl IncidentStore {
    pub fn new(config: Arc<Config>) -> Result<Arc<Self>> {
        let client = ChClient::default()
            .with_url(&config.clickhouse_url)
            .with_user(&config.clickhouse_user)
            .with_password(&config.clickhouse_password);

        let (sender, receiver) = mpsc::channel(INCIDENT_CHANNEL_CAPACITY);
        let store = Arc::new(Self {
            client,
            table: config.monitor_incidents_table.clone(),
            sender,
        });
        store.spawn_worker(receiver);
        Ok(store)
    }

    pub fn enqueue_rows(&self, rows: Vec<MonitorIncidentRow>) -> Result<()> {
        self.sender
            .try_send(rows)
            .map_err(|e| anyhow::anyhow!("enqueue_incident_failed: {e}"))
    }

    async fn insert_rows(&self, rows: Vec<MonitorIncidentRow>) -> Result<()> {
        for chunk in rows.chunks(INCIDENT_BATCH_SIZE) {
            let mut inserter = self.client.inserter(&self.table)?;
            for row in chunk {
                inserter.write(row)?;
            }
            inserter.end().await?;
        }
        Ok(())
    }

    fn spawn_worker(self: &Arc<Self>, mut receiver: mpsc::Receiver<Vec<MonitorIncidentRow>>) {
        let this = Arc::clone(self);
        tokio::spawn(async move {
            while let Some(batch) = receiver.recv().await {
                if let Err(err) = this.insert_rows(batch).await {
                    warn!(error = ?err, "Failed to insert incident rows");
                }
            }
        });
    }
}

const INCIDENT_BATCH_SIZE: usize = 200;
const INCIDENT_CHANNEL_CAPACITY: usize = 2_000;

impl IncidentState {
    pub fn as_str(&self) -> &'static str {
        match self {
            IncidentState::Open => "open",
            IncidentState::Resolved => "resolved",
            IncidentState::Flapping => "flapping",
            IncidentState::Muted => "muted",
        }
    }
}

impl IncidentSeverity {
    pub fn as_str(&self) -> &'static str {
        match self {
            IncidentSeverity::Info => "info",
            IncidentSeverity::Warning => "warning",
            IncidentSeverity::Critical => "critical",
        }
    }
}
