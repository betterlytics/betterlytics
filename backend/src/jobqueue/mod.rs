//! Producer-side access to the dashboard worker's pg-boss job queues.

use std::fmt::Debug;
use std::sync::Arc;

use serde::Serialize;
use sha2::{Digest, Sha256};
use tokio_postgres::error::SqlState;
use tokio_postgres::types::Json;
use tracing::info;

use crate::postgres::{PostgresError, PostgresPool};

/// The pg-boss schema version (`pgboss.schema` in its package.json) `ENQUEUE_SQL` was written
/// against. Re-verify the SQL against the new `pg-boss/dist/plans.js` before bumping.
pub const PGBOSS_SCHEMA_VERSION: i32 = 37;

/// The version recorded in `pgboss.version`, or `None` when the migrations have not run.
pub async fn schema_version(pool: &PostgresPool) -> Result<Option<i32>, PostgresError> {
    let conn = pool.connection().await?;
    match conn
        .query_opt("SELECT version FROM pgboss.version", &[])
        .await
    {
        Ok(row) => Ok(row.map(|r| r.get("version"))),
        Err(e) if e.code() == Some(&SqlState::UNDEFINED_TABLE) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

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

/// A payload for one of the worker's queues; its serialized form is what the worker's handler
/// receives and validates.
pub trait QueueJob: Serialize + Debug {
    /// Must match a `JOB_DEFINITIONS` entry in the dashboard.
    const QUEUE: &'static str;

    /// pg-boss singleton key: while a job with this key is pending, enqueuing another is a no-op.
    fn singleton_key(&self) -> String;
}

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

impl QueueJob for SendEmailJob {
    const QUEUE: &'static str = "send-email";

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
}

pub struct JobQueue {
    pool: Arc<PostgresPool>,
}

impl JobQueue {
    pub fn new(pool: Arc<PostgresPool>) -> Self {
        Self { pool }
    }

    pub async fn enqueue<J: QueueJob + Sync>(
        &self,
        job: &J,
        retry: RetryPolicy,
    ) -> Result<EnqueueOutcome, PostgresError> {
        let singleton_key = job.singleton_key();
        let conn = self.pool.connection().await?;

        let row = match conn
            .query_one(
                ENQUEUE_SQL,
                &[
                    &J::QUEUE,
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

        info!(queue = J::QUEUE, singleton_key, job_id = %id, "job enqueued");
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
        assert_eq!(SendEmailJob::QUEUE, "send-email");
        assert_eq!(job.singleton_key(), "monitor-down:incident:email:abc");
    }
}
