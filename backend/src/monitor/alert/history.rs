use bb8::{Pool, RunError};
use bb8_postgres::PostgresConnectionManager;
use chrono::Utc;
use std::time::Duration;
use thiserror::Error;
use tokio_postgres::{types::Type, NoTls, Config as PgConfig};
use tracing::info;

use super::tracker::AlertType;

#[derive(Debug, Error)]
pub enum AlertHistoryError {
    #[error("Invalid Postgres URL: {0}")]
    InvalidDatabaseUrl(String),
    #[error("Failed to get Postgres connection from pool: {0}")]
    Pool(#[from] RunError<tokio_postgres::Error>),
    #[error("Postgres query failed: {0}")]
    Query(#[from] tokio_postgres::Error),
}

/// Record of an alert that was sent
#[derive(Clone, Debug)]
pub struct AlertHistoryRecord {
    pub monitor_check_id: String,
    pub alert_type: AlertType,
    pub sent_to: Vec<String>,
    pub status_code: Option<i32>,
    pub error_message: Option<String>,
    pub latency_ms: Option<i32>,
    pub ssl_days_left: Option<i32>,
}

/// Writer for recording alert history to PostgreSQL
pub struct AlertHistoryWriter {
    pool: Pool<PostgresConnectionManager<NoTls>>,
}

impl AlertHistoryWriter {
    pub async fn new(database_url: &str) -> Result<Self, AlertHistoryError> {
        let mut config = PgConfig::new();
        
        // Parse the database URL
        let url = url::Url::parse(database_url)
            .map_err(|e| AlertHistoryError::InvalidDatabaseUrl(e.to_string()))?;
        
        if let Some(host) = url.host_str() {
            config.host(host);
        }
        if let Some(port) = url.port() {
            config.port(port);
        }
        if !url.username().is_empty() {
            config.user(url.username());
        }
        if let Some(password) = url.password() {
            config.password(password);
        }
        let dbname = url.path().trim_start_matches('/');
        if !dbname.is_empty() {
            config.dbname(dbname);
        }
        
        config.connect_timeout(Duration::from_secs(5));
        config.application_name("betterlytics_alert_history");

        let manager = PostgresConnectionManager::new(config, NoTls);
        let pool = Pool::builder()
            .max_size(2)
            .connection_timeout(Duration::from_secs(5))
            .build(manager)
            .await?;

        Ok(Self { pool })
    }

    /// Record an alert that was sent
    pub async fn record_alert(&self, record: &AlertHistoryRecord) -> Result<(), AlertHistoryError> {
        let conn = self.pool.get().await?;
        
        let alert_type_str = record.alert_type.as_str().to_string();

        let sent_at = Utc::now().naive_utc();

        // Use query_typed to explicitly specify TEXT type for the enum string,
        // allowing PostgreSQL to cast it to the enum type
        let stmt = conn.prepare_typed(
            r#"
            INSERT INTO "MonitorAlertHistory" (
                "monitorCheckId",
                "alertType",
                "sentTo",
                "sentAt",
                "statusCode",
                "errorMessage",
                "latencyMs",
                "sslDaysLeft"
            ) VALUES ($1, $2, $3::"MonitorAlertType", $4, $5, $6, $7, $8, $9)
            "#,
            &[
                Type::TEXT,  // monitorCheckId
                Type::TEXT,  // alertType - will be cast to enum
                Type::TEXT_ARRAY,  // sentTo
                Type::TIMESTAMP,  // sentAt
                Type::INT4,  // statusCode
                Type::TEXT,  // errorMessage
                Type::INT4,  // latencyMs
                Type::INT4,  // sslDaysLeft
            ],
        ).await?;

        conn.execute(
            &stmt,
            &[
                &record.monitor_check_id,
                &alert_type_str,
                &record.sent_to,
                &sent_at,
                &record.status_code,
                &record.error_message,
                &record.latency_ms,
                &record.ssl_days_left,
            ],
        )
        .await?;

        info!(
            monitor_check_id = %record.monitor_check_id,
            alert_type = %alert_type_str,
            recipients = record.sent_to.len(),
            "Alert history recorded"
        );

        Ok(())
    }
}
