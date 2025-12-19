use std::sync::Arc;

use chrono::Utc;
use tokio_postgres::types::Type;
use tracing::info;

use crate::postgres::{PostgresError, PostgresPool};
use super::tracker::AlertType;

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

/// Repository for recording alert history to PostgreSQL
pub struct AlertHistoryRepository {
    pool: Arc<PostgresPool>,
}

impl AlertHistoryRepository {
    pub fn new(pool: Arc<PostgresPool>) -> Self {
        Self { pool }
    }

    /// Record an alert that was sent
    pub async fn record_alert(&self, record: &AlertHistoryRecord) -> Result<(), PostgresError> {
        let conn = self.pool.connection().await?;
        
        let alert_type_str = record.alert_type.as_str().to_string();

        let sent_at = Utc::now().naive_utc();

        let stmt = conn
            .prepare_typed(
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
            ) VALUES ($1, $2::"MonitorAlertType", $3, $4, $5, $6, $7, $8)
            "#,
                &[
                    Type::TEXT,        // $1 monitorCheckId
                    Type::TEXT,        // $2 alertType - cast to enum
                    Type::TEXT_ARRAY,  // $3 sentTo
                    Type::TIMESTAMP,   // $4 sentAt
                    Type::INT4,        // $5 statusCode
                    Type::TEXT,        // $6 errorMessage
                    Type::INT4,        // $7 latencyMs
                    Type::INT4,        // $8 sslDaysLeft
                ],
            )
            .await?;

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
