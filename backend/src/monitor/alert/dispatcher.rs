use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use serde_json::json;
use tracing::{error, warn};
use uuid::Uuid;

use super::repository::{AlertDetails, AlertHistoryRecord, AlertHistoryWriter};
use crate::jobqueue::{recipient_key, EnqueueOutcome, JobQueue, RetryPolicy, SendEmailJob};
use crate::monitor::ReasonCode;

const MONITOR_ALERT_RETRY: RetryPolicy = RetryPolicy {
    limit: 8,
    delay_seconds: 30,
    backoff: true,
};

pub struct AlertContext<'a> {
    pub check_id: &'a str,
    pub site_id: &'a str,
    pub dashboard_id: &'a str,
    pub monitor_name: &'a str,
    pub url: &'a str,
    pub recipients: &'a [String],
}

#[derive(Debug, Clone)]
pub enum Alert {
    Down {
        incident_id: Uuid,
        reason_code: ReasonCode,
        status_code: Option<u16>,
    },
    Recovery {
        incident_id: Uuid,
        downtime_duration: Option<Duration>,
    },
    SslExpiring {
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
    },
    SslExpired {
        days_left: i32,
        expiry_date: Option<DateTime<Utc>>,
    },
}

impl Alert {
    pub fn as_str(&self) -> &'static str {
        match self {
            Alert::Down { .. } => "down",
            Alert::Recovery { .. } => "recovery",
            Alert::SslExpiring { .. } => "ssl_expiring",
            Alert::SslExpired { .. } => "ssl_expired",
        }
    }

    /// Worker email type; must be a key of `EMAIL_TYPES` in the dashboard.
    fn email_type(&self) -> &'static str {
        match self {
            Alert::Down { .. } => "monitor-down",
            Alert::Recovery { .. } => "monitor-recovery",
            Alert::SslExpiring { .. } | Alert::SslExpired { .. } => "monitor-ssl",
        }
    }

    /// Dedup scope for the worker's `sent_emails` table. Encodes whatever makes a re-alert
    /// legitimate (a new incident, a new SSL milestone, a renewed certificate) so dedup only
    /// ever suppresses true duplicates of the same notification.
    fn campaign_key(&self, check_id: &str) -> String {
        match self {
            Alert::Down { incident_id, .. } => format!("monitor-down:{incident_id}"),
            Alert::Recovery { incident_id, .. } => format!("monitor-recovery:{incident_id}"),
            Alert::SslExpiring {
                days_left,
                expiry_date,
            } => format!(
                "monitor-ssl-expiring:{check_id}:{}:{days_left}",
                expiry_bucket(*expiry_date)
            ),
            Alert::SslExpired { expiry_date, .. } => {
                format!(
                    "monitor-ssl-expired:{check_id}:{}",
                    expiry_bucket(*expiry_date)
                )
            }
        }
    }

    /// Recipient-independent payload fields; see `monitorAlertEmail.entities.ts` for the contract.
    fn email_data(&self, ctx: &AlertContext) -> serde_json::Value {
        let mut data = json!({
            "monitorName": ctx.monitor_name,
            "url": ctx.url,
            "dashboardId": ctx.dashboard_id,
            "monitorId": ctx.check_id,
        });
        let fields = data.as_object_mut().expect("json! object");

        match self {
            Alert::Down {
                reason_code,
                status_code,
                ..
            } => {
                fields.insert("reason".into(), json!(reason_code.to_message()));
                if let Some(code) = status_code {
                    fields.insert("statusCode".into(), json!(code));
                }
                fields.insert("detectedAt".into(), json!(Utc::now().to_rfc3339()));
            }
            Alert::Recovery {
                downtime_duration, ..
            } => {
                fields.insert("recoveredAt".into(), json!(Utc::now().to_rfc3339()));
                if let Some(duration) = downtime_duration {
                    fields.insert(
                        "downtimeSeconds".into(),
                        json!(duration.num_seconds().max(0)),
                    );
                }
            }
            Alert::SslExpiring {
                days_left,
                expiry_date,
            }
            | Alert::SslExpired {
                days_left,
                expiry_date,
            } => {
                fields.insert(
                    "expired".into(),
                    json!(matches!(self, Alert::SslExpired { .. })),
                );
                fields.insert("daysLeft".into(), json!(days_left));
                if let Some(date) = expiry_date {
                    fields.insert("expiresAt".into(), json!(date.to_rfc3339()));
                }
            }
        }

        data
    }

    /// One job per recipient, sharing the campaign key, timestamp and payload.
    fn build_jobs(&self, ctx: &AlertContext) -> Vec<SendEmailJob> {
        let kind = self.email_type();
        let campaign_key = self.campaign_key(ctx.check_id);
        let base_data = self.email_data(ctx);

        ctx.recipients
            .iter()
            .map(|recipient| {
                let mut data = base_data.clone();
                data["to"] = json!(recipient);
                SendEmailJob {
                    kind,
                    recipient: recipient.clone(),
                    recipient_key: recipient_key(recipient),
                    campaign_key: campaign_key.clone(),
                    data,
                }
            })
            .collect()
    }

    fn build_history_record(&self, ctx: &AlertContext, sent_to: Vec<String>) -> AlertHistoryRecord {
        let details = match self {
            Alert::Down { status_code, .. } => AlertDetails::Down {
                status_code: status_code.map(|c| c as i32),
            },
            Alert::Recovery { .. } => AlertDetails::Recovery,
            Alert::SslExpiring { days_left, .. } => AlertDetails::SslExpiring {
                days_left: *days_left,
            },
            Alert::SslExpired { days_left, .. } => AlertDetails::SslExpired {
                days_left: *days_left,
            },
        };
        AlertHistoryRecord::from_context(ctx, sent_to, details)
    }
}

fn expiry_bucket(expiry_date: Option<DateTime<Utc>>) -> String {
    expiry_date
        .map(|d| d.timestamp().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

pub struct AlertDispatcher {
    job_queue: Arc<JobQueue>,
    history_writer: Option<Arc<AlertHistoryWriter>>,
}

impl AlertDispatcher {
    pub fn new(job_queue: Arc<JobQueue>, history_writer: Option<Arc<AlertHistoryWriter>>) -> Self {
        Self {
            job_queue,
            history_writer,
        }
    }

    /// Enqueues one email per recipient. Returns `false` only when the alert must be retried on
    /// the next probe (queue missing or insert failed); already-pending and gated recipients
    /// count as handled.
    #[tracing::instrument(
        level = "debug",
        skip(self, ctx, alert),
        fields(check_id = %ctx.check_id)
    )]
    pub async fn dispatch(&self, ctx: AlertContext<'_>, alert: Alert) -> bool {
        let mut enqueued: Vec<String> = Vec::new();
        let mut failed = 0usize;

        for job in alert.build_jobs(&ctx) {
            match self.job_queue.send_email(&job, MONITOR_ALERT_RETRY).await {
                Ok(EnqueueOutcome::Enqueued) => enqueued.push(job.recipient),
                Ok(EnqueueOutcome::AlreadyPending) | Ok(EnqueueOutcome::Skipped) => {}
                Ok(EnqueueOutcome::QueueMissing) => {
                    warn!(
                        check_id = %ctx.check_id,
                        alert_type = %alert.as_str(),
                        "Cannot enqueue alert email: the send-email queue does not exist yet; \
                         has the dashboard worker started against this database?"
                    );
                    return false;
                }
                Err(e) => {
                    failed += 1;
                    error!(
                        check_id = %ctx.check_id,
                        alert_type = %alert.as_str(),
                        error = ?e,
                        "Failed to enqueue alert email"
                    );
                }
            }
        }

        if failed > 0 {
            return false;
        }

        if !enqueued.is_empty() {
            self.record_alert_history(alert.build_history_record(&ctx, enqueued));
        }
        true
    }

    fn record_alert_history(&self, record: AlertHistoryRecord) {
        if let Some(ref writer) = self.history_writer {
            let row = record.to_row();
            if let Err(e) = writer.enqueue_rows(vec![row]) {
                error!(
                    monitor_check_id = %record.monitor_check_id,
                    details = ?record.details,
                    error = ?e,
                    "Failed to record alert history"
                );
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ctx<'a>(recipients: &'a [String]) -> AlertContext<'a> {
        AlertContext {
            check_id: "check-1",
            site_id: "site-1",
            dashboard_id: "dash-1",
            monitor_name: "example.com",
            url: "https://example.com",
            recipients,
        }
    }

    #[test]
    fn campaign_keys_scope_dedup_to_the_notification() {
        let incident = Uuid::nil();
        let expiry = DateTime::from_timestamp(1_800_000_000, 0);

        let down = Alert::Down {
            incident_id: incident,
            reason_code: ReasonCode::Ok,
            status_code: None,
        };
        assert_eq!(
            down.campaign_key("check-1"),
            "monitor-down:00000000-0000-0000-0000-000000000000"
        );

        let expiring = Alert::SslExpiring {
            days_left: 7,
            expiry_date: expiry,
        };
        assert_eq!(
            expiring.campaign_key("check-1"),
            "monitor-ssl-expiring:check-1:1800000000:7"
        );

        let expired = Alert::SslExpired {
            days_left: -1,
            expiry_date: expiry,
        };
        assert_eq!(
            expired.campaign_key("check-1"),
            "monitor-ssl-expired:check-1:1800000000"
        );
    }

    #[test]
    fn down_job_matches_worker_contract() {
        let recipients = vec!["Owner@Example.com".to_string()];
        let alert = Alert::Down {
            incident_id: Uuid::nil(),
            reason_code: ReasonCode::TlsHandshakeFailed,
            status_code: Some(503),
        };

        let job = alert.build_jobs(&ctx(&recipients)).remove(0);

        assert_eq!(job.kind, "monitor-down");
        assert!(job.recipient_key.starts_with("email:"));
        assert_eq!(job.data["to"], "Owner@Example.com");
        assert_eq!(job.data["monitorName"], "example.com");
        assert_eq!(job.data["url"], "https://example.com");
        assert_eq!(job.data["dashboardId"], "dash-1");
        assert_eq!(job.data["monitorId"], "check-1");
        assert_eq!(
            job.data["reason"],
            ReasonCode::TlsHandshakeFailed.to_message()
        );
        assert_eq!(job.data["statusCode"], 503);
        assert!(job.data["detectedAt"].as_str().unwrap().contains('T'));
    }

    #[test]
    fn recovery_and_ssl_jobs_carry_their_fields() {
        let recipients = vec!["owner@example.com".to_string()];
        let c = ctx(&recipients);

        let recovery = Alert::Recovery {
            incident_id: Uuid::nil(),
            downtime_duration: Some(Duration::seconds(90)),
        }
        .build_jobs(&c)
        .remove(0);
        assert_eq!(recovery.kind, "monitor-recovery");
        assert_eq!(recovery.data["downtimeSeconds"], 90);
        assert!(recovery.data.get("recoveredAt").is_some());

        let ssl = Alert::SslExpired {
            days_left: -2,
            expiry_date: DateTime::from_timestamp(1_800_000_000, 0),
        }
        .build_jobs(&c)
        .remove(0);
        assert_eq!(ssl.kind, "monitor-ssl");
        assert_eq!(ssl.data["expired"], true);
        assert_eq!(ssl.data["daysLeft"], -2);
        assert_eq!(ssl.data["expiresAt"], "2027-01-15T08:00:00+00:00");
    }
}
