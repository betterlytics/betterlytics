//! Alert dispatcher for delivering notifications.
//!
//! Handles the mechanics of sending alerts via email and recording to history.

use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use tracing::{error, info};

use super::email as email_templates;
use super::repository::{AlertDetails, AlertHistoryRecord, AlertHistoryWriter};
use crate::config::EmailConfig;
use crate::email::{EmailRequest, EmailService};
use crate::monitor::ReasonCode;

#[derive(Clone, Debug)]
pub struct AlertDispatcherConfig {
    pub email_config: Option<EmailConfig>,
    pub public_base_url: String,
}

pub struct AlertContext<'a> {
    pub check_id: &'a str,
    pub site_id: &'a str,
    pub dashboard_id: &'a str,
    pub monitor_name: &'a str,
    pub url: &'a str,
    pub recipients: &'a [String],
}

/// Alert types for monitor notifications
#[derive(Debug, Clone)]
pub enum Alert {
    Down {
        reason_code: ReasonCode,
        status_code: Option<u16>,
    },
    Recovery {
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

    fn build_email(&self, ctx: &AlertContext, base_url: &str) -> EmailRequest {
        match self {
            Alert::Down { reason_code, status_code } => email_templates::build_down_alert(
                ctx.recipients,
                ctx.monitor_name,
                ctx.url,
                *reason_code,
                *status_code,
                base_url,
                ctx.dashboard_id,
                ctx.check_id,
            ),
            Alert::Recovery { downtime_duration } => email_templates::build_recovery_alert(
                ctx.recipients,
                ctx.monitor_name,
                ctx.url,
                *downtime_duration,
                base_url,
                ctx.dashboard_id,
                ctx.check_id,
            ),
            Alert::SslExpiring { days_left, expiry_date } => email_templates::build_ssl_alert(
                ctx.recipients,
                ctx.monitor_name,
                ctx.url,
                *days_left,
                *expiry_date,
                false, // is_expired
                base_url,
                ctx.dashboard_id,
                ctx.check_id,
            ),
            Alert::SslExpired { days_left, expiry_date } => email_templates::build_ssl_alert(
                ctx.recipients,
                ctx.monitor_name,
                ctx.url,
                *days_left,
                *expiry_date,
                true, // is_expired
                base_url,
                ctx.dashboard_id,
                ctx.check_id,
            ),
        }
    }

    fn build_history_record(&self, ctx: &AlertContext) -> AlertHistoryRecord {
        let details = match self {
            Alert::Down { status_code, .. } => AlertDetails::Down {
                status_code: status_code.map(|c| c as i32),
            },
            Alert::Recovery { .. } => AlertDetails::Recovery,
            Alert::SslExpiring { days_left, .. } => {
                AlertDetails::SslExpiring { days_left: *days_left }
            }
            Alert::SslExpired { days_left, .. } => {
                AlertDetails::SslExpired { days_left: *days_left }
            }
        };
        AlertHistoryRecord::from_context(ctx, details)
    }
}

/// Handles alert delivery: email sending and history recording
pub struct AlertDispatcher {
    email_service: Option<EmailService>,
    history_writer: Option<Arc<AlertHistoryWriter>>,
    public_base_url: String,
}

impl AlertDispatcher {
    pub fn new(
        config: AlertDispatcherConfig,
        history_writer: Option<Arc<AlertHistoryWriter>>,
    ) -> Self {
        let email_service = config.email_config.map(EmailService::new);

        Self {
            email_service,
            history_writer,
            public_base_url: config.public_base_url,
        }
    }

    pub fn has_email_service(&self) -> bool {
        self.email_service.is_some()
    }

    #[tracing::instrument(
        level = "debug",
        skip(self, ctx, alert),
        fields(check_id = %ctx.check_id)
    )]
    pub async fn dispatch(&self, ctx: AlertContext<'_>, alert: Alert) -> bool {
        let Some(email_service) = &self.email_service else {
            info!(
                recipients = ctx.recipients.len(),
                alert_type = %alert.as_str(),
                "Would send alert (email service not configured)"
            );
            return false;
        };

        let request = alert.build_email(&ctx, &self.public_base_url);

        match email_service.send(request).await {
            Ok(()) => {
                let record = alert.build_history_record(&ctx);
                self.record_alert_history(record);
                true
            }
            Err(e) => {
                error!(
                    check_id = %ctx.check_id,
                    alert_type = %alert.as_str(),
                    error = ?e,
                    "Failed to send alert email"
                );
                false
            }
        }
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
