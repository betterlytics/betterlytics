use std::sync::Arc;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tracing::warn;
use uuid::Uuid;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::alert::tracker::{IncidentState, IncidentSeverity, IncidentSnapshot};
use crate::monitor::models::{MonitorCheck, MonitorStatus, ReasonCode};

#[derive(clickhouse::Row, Serialize, Debug, Clone)]
pub struct MonitorIncidentRow {
    #[serde(with = "clickhouse::serde::uuid")]
    pub incident_id: Uuid,
    pub check_id: String,
    pub site_id: String,
    pub state: IncidentState,
    pub severity: IncidentSeverity,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub started_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub last_event_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub resolved_at: Option<DateTime<Utc>>,
    pub reason_code: String,
    pub failure_count: u16,
    pub last_status: MonitorStatus,
    pub status_code: Option<u16>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_down_at: Option<DateTime<Utc>>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_resolve_at: Option<DateTime<Utc>>,
    pub kind: String,
}

impl MonitorIncidentRow {
    pub fn from_snapshot(
        snapshot: &IncidentSnapshot,
        check: &MonitorCheck,
        notified: NotificationSnapshot,
    ) -> Option<Self> {
        let incident_id = snapshot.incident_id?;
        let kind = if check.url.scheme() == "https" { "https" } else { "http" };

        Some(Self {
            incident_id,
            check_id: check.id.clone(),
            site_id: check.site_id.clone(),
            state: snapshot.state,
            severity: snapshot.severity,
            started_at: snapshot.started_at.unwrap_or_else(Utc::now),
            last_event_at: snapshot.last_event_at.unwrap_or_else(Utc::now),
            resolved_at: snapshot.resolved_at,
            reason_code: snapshot
                .last_error_reason_code
                .map(|code| code.as_str().to_string())
                .unwrap_or_else(|| "unknown".to_string()),
            failure_count: snapshot.failure_count,
            last_status: snapshot
                .last_status
                .unwrap_or(MonitorStatus::Ok),
            status_code: snapshot.last_error_status_code,
            notified_down_at: notified.last_down,
            notified_resolve_at: notified.last_recovery,
            kind: kind.to_string(),
        })
    }
}

#[derive(Clone, Debug, Default)]
pub struct NotificationSnapshot {
    pub last_down: Option<DateTime<Utc>>,
    pub last_recovery: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub struct IncidentSeed {
    pub check_id: String,
    pub incident_id: Uuid,
    pub state: IncidentState,
    pub severity: IncidentSeverity,
    pub started_at: DateTime<Utc>,
    pub last_event_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub failure_count: u16,
    pub last_status: Option<MonitorStatus>,
    pub reason_code: ReasonCode,
    pub status_code: Option<u16>,
    pub notified_down_at: Option<DateTime<Utc>>,
    pub notified_resolve_at: Option<DateTime<Utc>>,
}

#[derive(clickhouse::Row, Deserialize)]
struct IncidentSeedRow {
    #[serde(with = "clickhouse::serde::uuid")]
    incident_id: Uuid,
    check_id: String,
    state: IncidentState,
    severity: IncidentSeverity,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    started_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    last_event_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    resolved_at: Option<DateTime<Utc>>,
    failure_count: u16,
    last_status: Option<i8>,
    reason_code: ReasonCode,
    status_code: Option<u16>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_down_at: Option<DateTime<Utc>>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub notified_resolve_at: Option<DateTime<Utc>>,
}

impl From<IncidentSeedRow> for IncidentSeed {
    fn from(row: IncidentSeedRow) -> Self {
        let last_status = row.last_status.and_then(|v| match v {
            1 => Some(MonitorStatus::Ok),
            2 => Some(MonitorStatus::Warn),
            3 => Some(MonitorStatus::Down),
            4 => Some(MonitorStatus::Error),
            _ => None,
        });

        Self {
            check_id: row.check_id,
            incident_id: row.incident_id,
            state: row.state,
            severity: row.severity,
            started_at: row.started_at,
            last_event_at: row.last_event_at,
            resolved_at: row.resolved_at,
            failure_count: row.failure_count,
            last_status,
            reason_code: row.reason_code,
            status_code: row.status_code,
            notified_down_at: row.notified_down_at,
            notified_resolve_at: row.notified_resolve_at,
        }
    }
}

pub struct IncidentStore {
    clickhouse: Arc<ClickHouseClient>,
    table: String,
    sender: mpsc::Sender<Vec<MonitorIncidentRow>>,
}

impl IncidentStore {
    pub fn new(clickhouse: Arc<ClickHouseClient>, table: &str) -> Result<Arc<Self>> {
        let (sender, receiver) = mpsc::channel(INCIDENT_CHANNEL_CAPACITY);
        let store = Arc::new(Self {
            clickhouse,
            table: table.to_string(),
            sender,
        });
        store.spawn_worker(receiver);
        Ok(store)
    }

    pub async fn load_active_incidents(&self) -> Result<Vec<IncidentSeed>> {
        let query = format!(
            r#"
            SELECT
                incident_id,
                check_id,
                state,
                severity,
                started_at,
                last_event_at,
                resolved_at,
                failure_count,
                if(toInt8(last_status) BETWEEN 1 AND 4, toInt8(last_status), NULL) as last_status,
                reason_code,
                status_code,
                notified_down_at,
                notified_resolve_at
            FROM {table}
            FINAL
            WHERE state = 1
            ORDER BY check_id, incident_id, last_event_at DESC
            LIMIT 1 BY check_id, incident_id
            "#,
            table = self.table
        );

        let rows: Vec<IncidentSeedRow> = self.clickhouse.inner().query(&query).fetch_all().await?;
        Ok(rows
            .into_iter()
            .map(IncidentSeed::from)
            .collect())
    }

    pub fn enqueue_rows(&self, rows: Vec<MonitorIncidentRow>) -> Result<()> {
        self.sender
            .try_send(rows)
            .map_err(|e| anyhow::anyhow!("enqueue_incident_failed: {e}"))
    }

    async fn insert_rows(&self, rows: Vec<MonitorIncidentRow>) -> Result<()> {
        for chunk in rows.chunks(INCIDENT_BATCH_SIZE) {
            let mut inserter = self.clickhouse.inner().inserter(&self.table)?;
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