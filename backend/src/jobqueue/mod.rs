//! Producer-side access to the dashboard worker's pg-boss job queues.

use std::sync::Arc;

use serde::Serialize;
use sha2::{Digest, Sha256};
use tokio_postgres::error::SqlState;
use tokio_postgres::types::Json;
use tracing::info;

use crate::postgres::{PostgresError, PostgresPool};

/// Mirrors pg-boss's own insert (`pg-boss/dist/plans.js` insertJobs) for the pinned version:
/// queue defaults come from `pgboss.queue`, and `policy` must be copied onto the row for the
/// exclusive-policy singleton index to apply. Always returns one row: `queue_exists`, and `id`
/// (NULL when the queue is missing or an identical job is already pending).
const ENQUEUE_SQL: &str = r#"
WITH q AS (
  SELECT name, policy, retry_delay_max, expire_seconds, deletion_seconds,
         retention_seconds, dead_letter, heartbeat_seconds
  FROM pgboss.queue
  WHERE name = $1::text
),
inserted AS (
  INSERT INTO pgboss.job (
    name, data, singleton_key, policy, retry_limit, retry_delay, retry_backoff,
    retry_delay_max, expire_seconds, deletion_seconds, keep_until, dead_letter, heartbeat_seconds
  )
  SELECT
    q.name, $2::jsonb, $3::text, q.policy, $4::int, $5::int, $6::boolean,
    q.retry_delay_max, q.expire_seconds, q.deletion_seconds,
    now() + q.retention_seconds * interval '1s', q.dead_letter, q.heartbeat_seconds
  FROM q
  ON CONFLICT DO NOTHING
  RETURNING id
)
SELECT
  EXISTS (SELECT 1 FROM q) AS queue_exists,
  (SELECT id::text FROM inserted) AS id
"#;

const SEND_EMAIL_QUEUE: &str = "send-email";

/// Per-job retry override; pg-boss stores these on the job row, so they take precedence over
/// the queue's defaults.
#[derive(Debug, Clone, Copy)]
pub struct RetryPolicy {
    pub limit: i32,
    pub delay_seconds: i32,
    pub backoff: bool,
}

pub fn recipient_key(email: &str) -> String {
    let normalized = email.trim().to_lowercase();
    let digest = Sha256::digest(normalized.as_bytes());
    format!("email:{}", hex::encode(digest))
}

/// `data` must satisfy the worker's zod schema for `kind`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SendEmailJob {
    #[serde(skip)]
    pub recipient: String,
    #[serde(rename = "type")]
    pub kind: &'static str,
    pub recipient_key: String,
    pub campaign_key: String,
    pub data: serde_json::Value,
}

impl SendEmailJob {
    fn singleton_key(&self) -> String {
        format!("{}:{}", self.campaign_key, self.recipient_key)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EnqueueOutcome {
    Enqueued,
    /// A job with the same singleton key is still pending (pg-boss exclusive policy), so the
    /// work is already accounted for.
    AlreadyPending,
    /// The worker has never created the queue (or its tables) in this database.
    QueueMissing,
    /// Not enqueued by design (see `EmailGate`); the caller should treat the work as handled.
    Skipped,
}

/// Nothing is enqueued when emails are disabled, 
/// and in development only `@betterlytics.io` recipients are allowed.
#[derive(Debug, Clone, Copy)]
pub struct EmailGate {
    pub enabled: bool,
    pub is_development: bool,
}

impl EmailGate {
    pub fn from_config(config: &crate::config::Config) -> Self {
        Self {
            enabled: config.enable_emails,
            is_development: config.is_development,
        }
    }

    fn skip_reason(&self, recipient: &str) -> Option<&'static str> {
        if !self.enabled {
            return Some("ENABLE_EMAILS=false");
        }
        if self.is_development && !is_betterlytics_recipient(recipient) {
            return Some("development mode only allows @betterlytics.io recipients");
        }
        None
    }
}

fn is_betterlytics_recipient(email: &str) -> bool {
    email
        .trim()
        .rsplit_once('@')
        .is_some_and(|(_, domain)| domain.eq_ignore_ascii_case("betterlytics.io"))
}

pub struct JobQueue {
    pool: Arc<PostgresPool>,
    email_gate: EmailGate,
}

impl JobQueue {
    pub fn new(pool: Arc<PostgresPool>, email_gate: EmailGate) -> Self {
        Self { pool, email_gate }
    }

    pub async fn send_email(
        &self,
        job: &SendEmailJob,
        retry: RetryPolicy,
    ) -> Result<EnqueueOutcome, PostgresError> {
        let singleton_key = job.singleton_key();
        if let Some(reason) = self.email_gate.skip_reason(&job.recipient) {
            info!(
                queue = SEND_EMAIL_QUEUE,
                singleton_key, reason, "email not enqueued"
            );
            return Ok(EnqueueOutcome::Skipped);
        }

        let conn = self.pool.connection().await?;

        let row = match conn
            .query_one(
                ENQUEUE_SQL,
                &[
                    &SEND_EMAIL_QUEUE,
                    &Json(job),
                    &singleton_key,
                    &retry.limit,
                    &retry.delay_seconds,
                    &retry.backoff,
                ],
            )
            .await
        {
            Ok(row) => row,
            // The pgboss schema is provisioned before the worker's first start; its tables are not.
            Err(e) if e.code() == Some(&SqlState::UNDEFINED_TABLE) => {
                return Ok(EnqueueOutcome::QueueMissing);
            }
            Err(e) => return Err(e.into()),
        };

        if !row.get::<_, bool>("queue_exists") {
            return Ok(EnqueueOutcome::QueueMissing);
        }
        let Some(id) = row.get::<_, Option<String>>("id") else {
            return Ok(EnqueueOutcome::AlreadyPending);
        };

        info!(queue = SEND_EMAIL_QUEUE, singleton_key, job_id = %id, "job enqueued");
        Ok(EnqueueOutcome::Enqueued)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recipient_key_matches_dashboard_derivation() {
        assert_eq!(
            recipient_key("  Owner@Example.com "),
            "email:c8cd3c6427301eaf6665bccacd65ddb614527acc843a15463e3faba57124c351"
        );
    }

    #[test]
    fn gate_skips_disabled_and_non_betterlytics_dev_recipients() {
        let off = EmailGate {
            enabled: false,
            is_development: false,
        };
        assert!(off.skip_reason("dev@betterlytics.io").is_some());

        let dev = EmailGate {
            enabled: true,
            is_development: true,
        };
        assert!(dev.skip_reason("Dev@Betterlytics.io").is_none());
        assert!(dev.skip_reason("owner@example.com").is_some());
        assert!(dev.skip_reason("spoof@betterlytics.io.evil.com").is_some());

        let prod = EmailGate {
            enabled: true,
            is_development: false,
        };
        assert!(prod.skip_reason("owner@example.com").is_none());
    }

    #[test]
    fn job_serializes_to_worker_envelope() {
        let job = SendEmailJob {
            recipient: "owner@example.com".to_string(),
            kind: "monitor-down",
            recipient_key: "email:abc".to_string(),
            campaign_key: "monitor-down:incident".to_string(),
            data: serde_json::json!({ "to": "owner@example.com" }),
        };
        let value = serde_json::to_value(&job).unwrap();
        assert_eq!(value["type"], "monitor-down");
        assert_eq!(value["recipientKey"], "email:abc");
        assert_eq!(value["campaignKey"], "monitor-down:incident");
        assert_eq!(value["data"]["to"], "owner@example.com");
        assert!(value.get("recipient").is_none());
        assert_eq!(job.singleton_key(), "monitor-down:incident:email:abc");
    }
}
