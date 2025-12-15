use std::str::FromStr;
use std::time::Duration;

use async_trait::async_trait;
use bb8::{Pool, PooledConnection, RunError};
use bb8_postgres::PostgresConnectionManager;
use chrono::{DateTime, NaiveDateTime, Utc};
use thiserror::Error;
use tokio_postgres::{Config as PgConfig, NoTls, Row};
use url::Url;

use crate::monitor::{HttpMethod, MonitorCheck, RequestHeader};

const BASE_SELECT: &str = r#"
SELECT
    mc.id AS id,
    mc.url AS url,
    mc."intervalSeconds" AS interval_seconds,
    mc."timeoutMs" AS timeout_ms,
    mc."isEnabled" AS is_enabled,
    mc."updatedAt" AS updated_at,
    mc."name" AS name,
    mc."httpMethod" AS http_method,
    mc."requestHeaders" AS request_headers,
    mc."acceptedStatusCodes" AS accepted_status_codes,
    mc."checkSslErrors" AS check_ssl_errors,
    d."siteId" AS site_id
FROM "MonitorCheck" mc
JOIN "Dashboard" d ON mc."dashboardId" = d.id
WHERE mc."isEnabled" = TRUE
"#;

const ORDER_BY_UPDATED_AT: &str = r#" ORDER BY mc."updatedAt" ASC"#;

#[derive(Debug, Error)]
pub enum MonitorRepositoryError {
    #[error("Invalid Postgres URL: {0}")]
    InvalidDatabaseUrl(String),
    #[error("Failed to get Postgres connection from pool: {0}")]
    Pool(#[from] RunError<tokio_postgres::Error>),
    #[error("Postgres query failed: {0}")]
    Query(#[from] tokio_postgres::Error),
    #[error("Invalid URL in monitor check: {0}")]
    InvalidUrl(String),
}

#[derive(Clone, Debug)]
pub struct MonitorCheckRecord {
    pub id: String,
    pub site_id: String,
    pub name: Option<String>,
    pub url: String,
    pub interval_seconds: i32,
    pub timeout_ms: i32,
    pub updated_at: DateTime<Utc>,
    pub http_method: String,
    pub request_headers: Option<String>,
    pub accepted_status_codes: Vec<i32>,
    pub check_ssl_errors: bool,
}

impl TryFrom<Row> for MonitorCheckRecord {
    type Error = tokio_postgres::Error;

    fn try_from(row: Row) -> Result<Self, Self::Error> {
        let updated_at: NaiveDateTime = row.try_get("updated_at")?;
        Ok(Self {
            id: row.try_get("id")?,
            site_id: row.try_get("site_id")?,
            name: row.try_get("name")?,
            url: row.try_get("url")?,
            interval_seconds: row.try_get("interval_seconds")?,
            timeout_ms: row.try_get("timeout_ms")?,
            updated_at: DateTime::<Utc>::from_naive_utc_and_offset(updated_at, Utc),
            http_method: row.try_get("http_method")?,
            request_headers: row.try_get("request_headers")?,
            accepted_status_codes: row.try_get("accepted_status_codes")?,
            check_ssl_errors: row.try_get("check_ssl_errors")?,
        })
    }
}

impl TryFrom<MonitorCheckRecord> for MonitorCheck {
    type Error = MonitorRepositoryError;

    fn try_from(record: MonitorCheckRecord) -> Result<Self, Self::Error> {
        let url = Url::parse(&record.url)
            .map_err(|e| MonitorRepositoryError::InvalidUrl(e.to_string()))?;

        let http_method = match record.http_method.to_uppercase().as_str() {
            "GET" => HttpMethod::Get,
            _ => HttpMethod::Head,
        };

        let request_headers = record
            .request_headers
            .and_then(|json_str| {
                serde_json::from_str::<Vec<RequestHeaderJson>>(&json_str).ok()
            })
            .map(|headers| {
                headers
                    .into_iter()
                    .filter(|h| !h.key.is_empty())
                    .map(|h| RequestHeader {
                        key: h.key,
                        value: h.value,
                    })
                    .collect()
            })
            .unwrap_or_default();

        Ok(Self {
            id: record.id,
            site_id: record.site_id,
            name: record.name,
            url,
            interval: Duration::from_secs(record.interval_seconds.max(1) as u64),
            timeout: Duration::from_millis(record.timeout_ms.max(1) as u64),
            updated_at: record.updated_at,
            http_method,
            request_headers,
            accepted_status_codes: record.accepted_status_codes,
            check_ssl_errors: record.check_ssl_errors,
        })
    }
}

#[derive(serde::Deserialize)]
struct RequestHeaderJson {
    key: String,
    #[serde(default)]
    value: String,
}

#[async_trait]
pub trait MonitorCheckDataSource: Send + Sync + 'static {
    async fn fetch_all_checks(&self) -> Result<Vec<MonitorCheck>, MonitorRepositoryError>;
    async fn fetch_checks_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<MonitorCheck>, MonitorRepositoryError>;
}

pub struct MonitorRepository {
    pool: Pool<PostgresConnectionManager<NoTls>>,
}

impl MonitorRepository {
    pub async fn new(database_url: &str) -> Result<Self, MonitorRepositoryError> {
        let mut config = PgConfig::from_str(database_url)
            .map_err(|e| MonitorRepositoryError::InvalidDatabaseUrl(e.to_string()))?;
        config.connect_timeout(Duration::from_secs(5));
        config.application_name("betterlytics_monitor_cache");

        let manager = PostgresConnectionManager::new(config, NoTls);
        let pool = Pool::builder()
            .max_size(2)
            .connection_timeout(Duration::from_secs(5))
            .build(manager)
            .await?;

        Ok(Self { pool })
    }

    async fn connection(
        &self,
    ) -> Result<PooledConnection<'_, PostgresConnectionManager<NoTls>>, MonitorRepositoryError>
    {
        Ok(self.pool.get().await?)
    }

    fn rows_to_checks(rows: Vec<Row>) -> Result<Vec<MonitorCheck>, MonitorRepositoryError> {
        rows.into_iter()
            .map(|row| {
                let record =
                    MonitorCheckRecord::try_from(row).map_err(MonitorRepositoryError::Query)?;
                MonitorCheck::try_from(record)
            })
            .collect()
    }
}

#[async_trait]
impl MonitorCheckDataSource for MonitorRepository {
    async fn fetch_all_checks(&self) -> Result<Vec<MonitorCheck>, MonitorRepositoryError> {
        let conn = self.connection().await?;
        let query = format!("{BASE_SELECT}{ORDER_BY_UPDATED_AT}");
        let rows = conn.query(&query, &[]).await?;
        Self::rows_to_checks(rows)
    }

    async fn fetch_checks_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<MonitorCheck>, MonitorRepositoryError> {
        let conn = self.connection().await?;
        let query = format!(r#"{BASE_SELECT} AND mc."updatedAt" >= $1{ORDER_BY_UPDATED_AT}"#);
        let rows = conn.query(&query, &[&since.naive_utc()]).await?;
        Self::rows_to_checks(rows)
    }
}
