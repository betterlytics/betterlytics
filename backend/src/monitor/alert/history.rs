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

        // Generate a cuid-like ID (simple approach using nanoid pattern)
        let id = generate_cuid();
        let sent_at = Utc::now().naive_utc();

        // Use query_typed to explicitly specify TEXT type for the enum string,
        // allowing PostgreSQL to cast it to the enum type
        let stmt = conn.prepare_typed(
            r#"
            INSERT INTO "MonitorAlertHistory" (
                id,
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
                Type::TEXT,  // id
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
                &id,
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

/// Generate a cuid-like ID for the alert history record
fn generate_cuid() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    
    // Simple cuid-like format: c + timestamp_base36 + random
    let ts_part = format_radix(timestamp as u64, 36);
    let random_part: String = (0..8)
        .map(|_| {
            let idx = rand::random::<usize>() % 36;
            char::from_digit(idx as u32, 36).unwrap_or('0')
        })
        .collect();
    
    format!("c{}{}", ts_part, random_part)
}

fn format_radix(mut n: u64, radix: u32) -> String {
    let mut result = Vec::new();
    loop {
        let digit = (n % radix as u64) as u32;
        result.push(char::from_digit(digit, radix).unwrap_or('0'));
        n /= radix as u64;
        if n == 0 {
            break;
        }
    }
    result.into_iter().rev().collect()
}

