//! Notification tracking - manages per-monitor notification state and cooldowns
//!
//! Prevents duplicate alerts by tracking:
//! - Last notified incident ID (for down/recovery)
//! - Last notification timestamp (for SSL cooldowns)

use std::collections::HashSet;
use std::sync::Arc;

use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use tracing::info;
use uuid::Uuid;

use crate::monitor::incident::{IncidentSeed, NotificationSnapshot};

/// Per-monitor notification timestamps
#[derive(Clone, Debug, Default)]
struct NotificationTimestamps {
    last_down: Option<DateTime<Utc>>,
    last_down_incident: Option<Uuid>,
    last_recovery: Option<DateTime<Utc>>,
    last_recovery_incident: Option<Uuid>,
    last_ssl: Option<DateTime<Utc>>,
}

/// Tracks notification state to prevent duplicates and enforce cooldowns
pub struct NotificationTracker {
    state: DashMap<String, NotificationTimestamps>,
    ssl_cooldown: Duration,
}

impl NotificationTracker {
    pub fn new(ssl_cooldown: Duration) -> Arc<Self> {
        Arc::new(Self {
            state: DashMap::new(),
            ssl_cooldown,
        })
    }

    /// Hydrate notification state from persisted incident data
    pub fn hydrate_from_incidents(&self, seeds: &[IncidentSeed]) {
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
        }

        if count > 0 {
            info!(
                hydrated = count,
                "NotificationTracker hydrated from incident seeds"
            );
        }
    }

    /// Check if we should notify for a down incident
    /// Returns false if we've already notified for this exact incident
    pub fn should_notify_down(&self, check_id: &str, incident_id: Uuid) -> bool {
        let entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_down_incident != Some(incident_id)
    }

    /// Mark that we've sent a down notification for this incident
    pub fn mark_notified_down(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_down = Some(Utc::now());
        entry.last_down_incident = Some(incident_id);
    }

    /// Mark that we've sent a recovery notification for this incident
    pub fn mark_notified_recovery(&self, check_id: &str, incident_id: Uuid) {
        let mut entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_recovery = Some(Utc::now());
        entry.last_recovery_incident = Some(incident_id);
    }

    /// Check if we should notify for an SSL expiry
    /// Returns true if: days_left <= threshold AND cooldown period has passed
    pub fn should_notify_ssl(&self, check_id: &str, days_left: i32, threshold: i32) -> bool {
        if days_left > threshold {
            return false;
        }

        let entry = self.state.entry(check_id.to_string()).or_default();
        let now = Utc::now();

        entry
            .last_ssl
            .map(|t| now.signed_duration_since(t) > self.ssl_cooldown)
            .unwrap_or(true)
    }

    /// Mark that we've sent an SSL notification
    pub fn mark_notified_ssl(&self, check_id: &str) {
        let mut entry = self.state.entry(check_id.to_string()).or_default();
        entry.last_ssl = Some(Utc::now());
    }

    /// Get a snapshot for persistence
    pub fn snapshot(&self, check_id: &str) -> NotificationSnapshot {
        self.state
            .get(check_id)
            .map(|t| NotificationSnapshot {
                last_down: t.last_down,
                last_recovery: t.last_recovery,
            })
            .unwrap_or_default()
    }

    /// Remove state for monitors that no longer exist
    pub fn prune_inactive(&self, active_ids: &HashSet<String>) {
        self.state.retain(|id, _| active_ids.contains(id));
    }
}
