use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use chrono::{DateTime, NaiveDateTime, Utc};
use tokio_postgres::types::Json;
use thiserror::Error;
use tokio_postgres::Row;
use url::Url;

use crate::monitor::{AlertConfig, HttpMethod, MonitorCheck, RequestHeader, StatusCodeValue};
use crate::postgres::{PostgresError, PostgresPool};

const BASE_SELECT: &str = r#"
SELECT
    mc.id AS id,
    mc."dashboardId" AS dashboard_id,
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
    d."siteId" AS site_id,
    -- Alert configuration
    mc."alertsEnabled" AS alerts_enabled,
    mc."alertOnDown" AS alert_on_down,
    mc."alertOnRecovery" AS alert_on_recovery,
    mc."alertOnSslExpiry" AS alert_on_ssl_expiry,
    mc."sslExpiryAlertDays" AS ssl_expiry_alert_days,
    mc."failureThreshold" AS failure_threshold,
    -- Alert recipients (user-configured emails)
    COALESCE(mc."alertEmails", ARRAY[]::text[]) AS alert_recipients
FROM "MonitorCheck" mc
JOIN "Dashboard" d ON mc."dashboardId" = d.id
WHERE mc."isEnabled" = TRUE
AND mc."deletedAt" IS NULL
"#;

const ORDER_BY_UPDATED_AT: &str = r#" ORDER BY mc."updatedAt" ASC"#;

#[derive(Debug, Error)]
pub enum MonitorRepositoryError {
    #[error(transparent)]
    Postgres(#[from] PostgresError),
    #[error("Invalid URL in monitor check: {0}")]
    InvalidUrl(String),
}

#[derive(Clone, Debug)]
pub struct MonitorCheckRecord {
    pub id: String,
    pub dashboard_id: String,
    pub site_id: String,
    pub name: Option<String>,
    pub url: String,
    pub interval_seconds: i32,
    pub timeout_ms: i32,
    pub updated_at: DateTime<Utc>,
    pub http_method: String,
    pub request_headers: Vec<RequestHeader>,
    pub accepted_status_codes: Vec<StatusCodeValue>,
    pub check_ssl_errors: bool,
    // Alert configuration
    pub alerts_enabled: bool,
    pub alert_on_down: bool,
    pub alert_on_recovery: bool,
    pub alert_on_ssl_expiry: bool,
    pub ssl_expiry_alert_days: i32,
    pub failure_threshold: i32,
    pub alert_recipients: Vec<String>,
}

impl TryFrom<Row> for MonitorCheckRecord {
    type Error = tokio_postgres::Error;

    fn try_from(row: Row) -> Result<Self, Self::Error> {
        let updated_at: NaiveDateTime = row.try_get("updated_at")?;
        let request_headers = row
            .try_get::<_, Option<Json<Vec<RequestHeaderJson>>>>("request_headers")?
            .map(|json| json.0)
            .unwrap_or_default()
            .into_iter()
            .filter(|h| !h.key.is_empty())
            .map(Into::into)
            .collect();
        
        // Parse alert recipients (may be NULL or empty array)
        let alert_recipients: Vec<String> = row
            .try_get::<_, Option<Vec<String>>>("alert_recipients")?
            .unwrap_or_default();

        // Parse accepted status codes from JSON (can be integers or strings like "2xx")
        let accepted_status_codes = row
            .try_get::<_, Option<Json<Vec<StatusCodeValue>>>>("accepted_status_codes")?
            .map(|json| json.0)
            .unwrap_or_default();

        Ok(Self {
            id: row.try_get("id")?,
            dashboard_id: row.try_get("dashboard_id")?,
            site_id: row.try_get("site_id")?,
            name: row.try_get("name")?,
            url: row.try_get("url")?,
            interval_seconds: row.try_get("interval_seconds")?,
            timeout_ms: row.try_get("timeout_ms")?,
            updated_at: DateTime::<Utc>::from_naive_utc_and_offset(updated_at, Utc),
            http_method: row.try_get("http_method")?,
            request_headers,
            accepted_status_codes,
            check_ssl_errors: row.try_get("check_ssl_errors")?,
            // Alert configuration
            alerts_enabled: row.try_get("alerts_enabled")?,
            alert_on_down: row.try_get("alert_on_down")?,
            alert_on_recovery: row.try_get("alert_on_recovery")?,
            alert_on_ssl_expiry: row.try_get("alert_on_ssl_expiry")?,
            ssl_expiry_alert_days: row.try_get("ssl_expiry_alert_days")?,
            failure_threshold: row.try_get("failure_threshold")?,
            alert_recipients,
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

        Ok(Self {
            id: record.id,
            dashboard_id: record.dashboard_id,
            site_id: record.site_id,
            name: record.name,
            url,
            interval: Duration::from_secs(record.interval_seconds.max(1) as u64),
            timeout: Duration::from_millis(record.timeout_ms.max(1) as u64),
            updated_at: record.updated_at,
            http_method,
            request_headers: record.request_headers,
            accepted_status_codes: record.accepted_status_codes,
            check_ssl_errors: record.check_ssl_errors,
            alert: AlertConfig {
                enabled: record.alerts_enabled,
                on_down: record.alert_on_down,
                on_recovery: record.alert_on_recovery,
                on_ssl_expiry: record.alert_on_ssl_expiry,
                ssl_expiry_days: record.ssl_expiry_alert_days,
                failure_threshold: record.failure_threshold,
                recipients: record.alert_recipients,
            },
        })
    }
}

#[derive(serde::Deserialize)]
struct RequestHeaderJson {
    key: String,
    #[serde(default)]
    value: String,
}

impl From<RequestHeaderJson> for RequestHeader {
    fn from(h: RequestHeaderJson) -> Self {
        Self { key: h.key, value: h.value }
    }
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
    pool: Arc<PostgresPool>,
}

impl MonitorRepository {
    pub fn new(pool: Arc<PostgresPool>) -> Self {
        Self { pool }
    }

    fn rows_to_checks(rows: Vec<Row>) -> Result<Vec<MonitorCheck>, MonitorRepositoryError> {
        rows.into_iter()
            .map(|row| {
                let record = MonitorCheckRecord::try_from(row)
                    .map_err(|e| MonitorRepositoryError::Postgres(PostgresError::Query(e)))?;
                MonitorCheck::try_from(record)
            })
            .collect()
    }
}

#[async_trait]
impl MonitorCheckDataSource for MonitorRepository {
    async fn fetch_all_checks(&self) -> Result<Vec<MonitorCheck>, MonitorRepositoryError> {
        let conn = self.pool.connection().await?;
        let query = format!("{BASE_SELECT}{ORDER_BY_UPDATED_AT}");
        let rows = conn.query(&query, &[]).await
            .map_err(|e| MonitorRepositoryError::Postgres(PostgresError::Query(e)))?;
        Self::rows_to_checks(rows)
    }

    async fn fetch_checks_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<MonitorCheck>, MonitorRepositoryError> {
        let conn = self.pool.connection().await?;
        let query = format!(r#"{BASE_SELECT} AND mc."updatedAt" >= $1{ORDER_BY_UPDATED_AT}"#);
        let rows = conn.query(&query, &[&since.naive_utc()]).await
            .map_err(|e| MonitorRepositoryError::Postgres(PostgresError::Query(e)))?;
        Self::rows_to_checks(rows)
    }
}
