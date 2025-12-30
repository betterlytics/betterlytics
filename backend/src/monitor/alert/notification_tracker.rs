use std::collections::HashSet;
use std::sync::Arc;

use chrono::{DateTime, Utc};
use dashmap::DashMap;
use tracing::info;
use uuid::Uuid;

use crate::monitor::incident::{IncidentSeed, NotificationSnapshot};

/// Milestone days for SSL expiry notifications
pub const SSL_MILESTONES: [i32; 5] = [30, 14, 7, 3, 1];

/// Per-monitor notification timestamps
#[derive(Clone, Debug, Default)]
struct NotificationTimestamps {
    last_down: Option<DateTime<Utc>>,
    last_down_incident: Option<Uuid>,
    last_recovery: Option<DateTime<Utc>>,
    last_recovery_incident: Option<Uuid>,
    last_ssl: Option<DateTime<Utc>>,
    last_ssl_expired_for: Option<DateTime<Utc>>,
    last_ssl_milestone_notified: Option<i32>,
}

/// Tracks notification state to prevent duplicates and enforce cooldowns
pub struct NotificationTracker {
    state: DashMap<String, NotificationTimestamps>,
}

impl NotificationTracker {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            state: DashMap::new(),
        })
    }

    pub fn warm_from_incidents(&self, seeds: &[IncidentSeed]) {
        let mut count = 0;
        for seed in seeds {
            let mut entry = self.state.entry(seed.check_id.clone()).or_default();

            if let Some(ts) = seed.notified_down_at {
                entry.last_down = Some(ts);
                entry.last_down_incident = Some(seed.incident_id);
                count += 1;
            }

            if let Some(ts) = seed.notified_resolve_at {
                entry.last_recovery = Some(ts);
                entry.last_recovery_incident = Some(seed.incident_id);
            }

            if let Some(milestone) = seed.last_ssl_milestone_notified {
                entry.last_ssl_milestone_notified = Some(milestone);
            }
        }

        if count > 0 {
            info!(
                warmed = count,
                "NotificationTracker warmed from incident seeds"
            );
        }
    }

    pub fn should_notify_down(&self, check_id: &str, incident_id: Uuid) -> bool {
        let entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_down_incident != Some(incident_id)
    }

    pub fn mark_notified_down(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_down = Some(Utc::now());
        entry.last_down_incident = Some(incident_id);
    }

    pub fn mark_notified_recovery(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_recovery = Some(Utc::now());
        entry.last_recovery_incident = Some(incident_id);
    }

    /// Check if we should notify for an SSL expiry
    /// - For expired certs we only notify ONCE per unique expiry date
    /// - For expiring certs we notify at milestone days
    pub fn should_notify_ssl(
        &self,
        check_id: &str,
        days_left: i32,
        threshold: i32,
        expired: bool,
        expiry_date: Option<DateTime<Utc>>,
    ) -> bool {
        if days_left > threshold {
            return false;
        }

        let entry = self.state.entry(check_id.to_string()).or_default();

        if expired {
            return match (entry.last_ssl_expired_for, expiry_date) {
                (Some(last), Some(current)) => last != current,
                (None, Some(_)) => true,
                _ => false,
            };
        }

        let is_milestone = SSL_MILESTONES.iter().any(|&m| days_left == m && m <= threshold);
        if !is_milestone {
            return false;
        }

        if entry.last_ssl_milestone_notified == Some(days_left) {
            return false;
        }

        true
    }

    pub fn mark_notified_ssl(&self, check_id: &str, expired: bool, expiry_date: Option<DateTime<Utc>>, days_left: i32) {
        let mut entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_ssl = Some(Utc::now());
        
        if expired {
            entry.last_ssl_expired_for = expiry_date;
        } else {
            entry.last_ssl_milestone_notified = Some(days_left);
        }
    }

    pub fn snapshot(&self, check_id: &str) -> NotificationSnapshot {
        self.state
            .get(check_id)
            .map(|t| NotificationSnapshot {
                last_down: t.last_down,
                last_recovery: t.last_recovery,
                last_ssl_milestone: t.last_ssl_milestone_notified,
            })
            .unwrap_or_default()
    }

    pub fn prune_inactive(&self, active_ids: &HashSet<String>) {
        self.state.retain(|id, _| active_ids.contains(id));
    }
}
