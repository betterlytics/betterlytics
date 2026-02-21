use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration as StdDuration;

use arc_swap::ArcSwap;
use chrono::{DateTime, TimeZone, Utc};
use tokio::sync::RwLock;
use tokio::time::{interval, MissedTickBehavior};
use tracing::{debug, warn};

use crate::postgres::PostgresError;
use crate::utils::spawn_supervised;

use super::repository::{IntegrationDataSource, IntegrationRecord};

const HEALTH_CHECK_INTERVAL: StdDuration = StdDuration::from_secs(30);

#[derive(Clone, Copy, Debug)]
pub struct IntegrationCacheConfig {
    pub partial_refresh_interval: StdDuration,
    pub full_refresh_interval: StdDuration,
    pub stale_after: StdDuration,
}

impl Default for IntegrationCacheConfig {
    fn default() -> Self {
        Self {
            partial_refresh_interval: StdDuration::from_secs(30),
            full_refresh_interval: StdDuration::from_secs(180),
            stale_after: StdDuration::from_secs(300),
        }
    }
}

#[derive(Clone, Debug)]
pub struct IntegrationConfig {
    pub id: String,
    pub integration_type: String,
    pub config: serde_json::Value,
}

impl From<IntegrationRecord> for IntegrationConfig {
    fn from(record: IntegrationRecord) -> Self {
        Self {
            id: record.id,
            integration_type: record.integration_type,
            config: record.config,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum IntegrationCacheError {
    #[error(transparent)]
    Postgres(#[from] PostgresError),
}

pub struct IntegrationCache {
    integrations: ArcSwap<HashMap<String, Vec<Arc<IntegrationConfig>>>>,
    data_source: Arc<dyn IntegrationDataSource>,
    refresh_config: IntegrationCacheConfig,
    last_full_refresh_at: RwLock<Option<DateTime<Utc>>>,
    last_seen_updated_at: RwLock<Option<DateTime<Utc>>>,
    last_refresh_success_at: RwLock<Option<DateTime<Utc>>>,
}

impl IntegrationCache {
    pub async fn initialize(
        data_source: Arc<dyn IntegrationDataSource>,
        config: IntegrationCacheConfig,
    ) -> Result<Arc<Self>, IntegrationCacheError> {
        let cache = Arc::new(Self {
            integrations: ArcSwap::from_pointee(HashMap::new()),
            data_source,
            refresh_config: config,
            last_full_refresh_at: RwLock::new(None),
            last_seen_updated_at: RwLock::new(None),
            last_refresh_success_at: RwLock::new(None),
        });

        cache.perform_full_refresh().await?;
        cache.spawn_refresh_tasks();
        Ok(cache)
    }

    pub fn get(&self, dashboard_id: &str) -> Vec<Arc<IntegrationConfig>> {
        let map = self.integrations.load();
        map.get(dashboard_id).cloned().unwrap_or_default()
    }

    async fn perform_full_refresh(&self) -> Result<(), IntegrationCacheError> {
        let records = self.data_source.fetch_all_integrations().await?;
        let max_updated = records.iter().map(|r| r.updated_at).max();

        let new_map = Self::build_map(records);
        let count: usize = new_map.values().map(|v| v.len()).sum();

        self.integrations.store(Arc::new(new_map));
        *self.last_full_refresh_at.write().await = Some(Utc::now());
        self.update_last_seen(max_updated).await;
        self.mark_refresh_success().await;
        debug!(count = count, "integration cache fully refreshed");
        Ok(())
    }

    async fn perform_partial_refresh(&self) -> Result<(), IntegrationCacheError> {
        let since = self
            .last_seen_updated_at
            .read()
            .await
            .unwrap_or_else(epoch_timestamp);

        let updates = self
            .data_source
            .fetch_integrations_updated_since(since)
            .await?;

        if updates.is_empty() {
            self.mark_refresh_success().await;
            return Ok(());
        }

        let max_updated = updates.iter().map(|r| r.updated_at).max();

        let affected_dashboard_ids: Vec<String> = updates
            .iter()
            .map(|r| r.dashboard_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let enabled_updates: Vec<_> = updates.into_iter().filter(|r| r.enabled).collect();
        let updates_map = Self::build_map(enabled_updates);

        self.integrations.rcu(|current| {
            let mut new_map = (**current).clone();

            for dashboard_id in &affected_dashboard_ids {
                match updates_map.get(dashboard_id) {
                    Some(new_entries) => {
                        new_map.insert(dashboard_id.clone(), new_entries.clone());
                    }
                    None => {
                        new_map.remove(dashboard_id);
                    }
                }
            }

            Arc::new(new_map)
        });

        let updated = affected_dashboard_ids.len();
        self.update_last_seen(max_updated).await;
        self.mark_refresh_success().await;
        debug!(dashboards_updated = updated, "integration cache partially refreshed");
        Ok(())
    }

    fn build_map(records: Vec<IntegrationRecord>) -> HashMap<String, Vec<Arc<IntegrationConfig>>> {
        let mut map: HashMap<String, Vec<Arc<IntegrationConfig>>> = HashMap::new();
        for record in records {
            let dashboard_id = record.dashboard_id.clone();
            map.entry(dashboard_id)
                .or_default()
                .push(Arc::new(IntegrationConfig::from(record)));
        }
        map
    }

    async fn mark_refresh_success(&self) {
        let now = Utc::now();
        *self.last_refresh_success_at.write().await = Some(now);
    }

    async fn update_last_seen(&self, candidate: Option<DateTime<Utc>>) {
        if let Some(ts) = candidate {
            let mut guard = self.last_seen_updated_at.write().await;
            *guard = Some(match *guard {
                Some(existing) => existing.max(ts),
                None => ts,
            });
        }
    }

    fn spawn_refresh_tasks(self: &Arc<Self>) {
        let this = Arc::clone(self);
        spawn_supervised("integration_cache_partial_refresh", move || {
            let this = Arc::clone(&this);
            async move { Self::partial_refresh_loop(this).await }
        });

        let this = Arc::clone(self);
        spawn_supervised("integration_cache_full_refresh", move || {
            let this = Arc::clone(&this);
            async move { Self::full_refresh_loop(this).await }
        });

        let this = Arc::clone(self);
        spawn_supervised("integration_cache_health", move || {
            let this = Arc::clone(&this);
            async move { Self::health_monitor_loop(this).await }
        });
    }

    async fn partial_refresh_loop(this: Arc<Self>) {
        let mut ticker = interval(this.refresh_config.partial_refresh_interval);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            if let Err(err) = this.perform_partial_refresh().await {
                warn!(error = ?err, "integration cache partial refresh failed");
            }
        }
    }

    async fn full_refresh_loop(this: Arc<Self>) {
        let mut ticker = interval(this.refresh_config.full_refresh_interval);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            if let Err(err) = this.perform_full_refresh().await {
                warn!(error = ?err, "integration cache full refresh failed");
            }
        }
    }

    async fn health_monitor_loop(this: Arc<Self>) {
        let mut ticker = interval(HEALTH_CHECK_INTERVAL);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            this.evaluate_health().await;
        }
    }

    async fn evaluate_health(&self) {
        let stale_after = self.refresh_config.stale_after;
        if stale_after.is_zero() {
            return;
        }
        let healthy = {
            let last = *self.last_refresh_success_at.read().await;
            match last {
                Some(ts) => Utc::now()
                    .signed_duration_since(ts)
                    .to_std()
                    .map(|elapsed| elapsed <= stale_after)
                    .unwrap_or(false),
                None => false,
            }
        };

        if !healthy {
            warn!(
                stale_seconds = stale_after.as_secs(),
                "integration cache data is older than the allowed threshold"
            );
        }
    }
}

fn epoch_timestamp() -> DateTime<Utc> {
    Utc.timestamp_opt(0, 0).unwrap()
}
