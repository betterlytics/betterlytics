use std::sync::Arc;

use async_trait::async_trait;
use chrono::{DateTime, NaiveDateTime, Utc};
use tokio_postgres::Row;

use tracing::warn;

use crate::postgres::{PostgresError, PostgresPool};

use super::crypto;

const SELECT_ENABLED: &str = r#"
SELECT
    "id",
    "dashboardId" AS dashboard_id,
    "type" AS integration_type,
    "enabled",
    "config",
    "updatedAt" AS updated_at
FROM "DashboardIntegration"
WHERE "enabled" = true
"#;

const SELECT_ALL: &str = r#"
SELECT
    "id",
    "dashboardId" AS dashboard_id,
    "type" AS integration_type,
    "enabled",
    "config",
    "updatedAt" AS updated_at
FROM "DashboardIntegration"
"#;

const ORDER_BY_UPDATED_AT: &str = r#" ORDER BY "updatedAt" ASC"#;

#[derive(Clone, Debug)]
pub struct IntegrationRecord {
    pub id: String,
    pub dashboard_id: String,
    pub integration_type: String,
    pub enabled: bool,
    pub config: serde_json::Value,
    pub updated_at: DateTime<Utc>,
}

impl IntegrationRecord {
    fn try_from_row(row: Row, encryption_key: Option<&str>) -> Result<Self, String> {
        let id: String = row.try_get("id").map_err(|e| e.to_string())?;
        let raw_config: serde_json::Value = row.try_get("config").map_err(|e| e.to_string())?;
        let updated_at: NaiveDateTime = row.try_get("updated_at").map_err(|e| e.to_string())?;

        let config = match encryption_key {
            Some(key) => crypto::decrypt_config(&raw_config, key)
                .map_err(|e| format!("failed to decrypt config for integration {id}: {e}"))?,
            None => raw_config,
        };

        Ok(Self {
            id,
            dashboard_id: row.try_get("dashboard_id").map_err(|e| e.to_string())?,
            integration_type: row.try_get("integration_type").map_err(|e| e.to_string())?,
            enabled: row.try_get("enabled").map_err(|e| e.to_string())?,
            config,
            updated_at: DateTime::<Utc>::from_naive_utc_and_offset(updated_at, Utc),
        })
    }
}

#[async_trait]
pub trait IntegrationDataSource: Send + Sync + 'static {
    async fn fetch_all_integrations(&self) -> Result<Vec<IntegrationRecord>, PostgresError>;

    async fn fetch_integrations_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<IntegrationRecord>, PostgresError>;
}

pub struct IntegrationRepository {
    pool: Arc<PostgresPool>,
    encryption_key: Option<String>,
}

impl IntegrationRepository {
    pub fn new(pool: Arc<PostgresPool>, encryption_key: Option<String>) -> Self {
        Self {
            pool,
            encryption_key,
        }
    }

    fn rowset_to_records(
        &self,
        rows: Vec<Row>,
    ) -> Result<Vec<IntegrationRecord>, PostgresError> {
        let mut records = Vec::with_capacity(rows.len());
        for row in rows {
            match IntegrationRecord::try_from_row(row, self.encryption_key.as_deref()) {
                Ok(record) => records.push(record),
                Err(err) => {
                    warn!(error = ?err, "skipping integration row due to parse error");
                }
            }
        }
        Ok(records)
    }
}

#[async_trait]
impl IntegrationDataSource for IntegrationRepository {
    async fn fetch_all_integrations(&self) -> Result<Vec<IntegrationRecord>, PostgresError> {
        let conn = self.pool.connection().await?;
        let query = format!("{SELECT_ENABLED}{ORDER_BY_UPDATED_AT}");
        let rows = conn.query(&query, &[]).await?;
        self.rowset_to_records(rows)
    }

    async fn fetch_integrations_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<IntegrationRecord>, PostgresError> {
        let conn = self.pool.connection().await?;
        let query = format!(
            r#"{SELECT_ALL} WHERE "updatedAt" > $1{ORDER_BY_UPDATED_AT}"#
        );
        let rows = conn.query(&query, &[&since.naive_utc()]).await?;
        self.rowset_to_records(rows)
    }
}
