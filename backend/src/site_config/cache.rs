use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration as StdDuration;

use arc_swap::ArcSwap;
use chrono::{DateTime, TimeZone, Utc};
use tokio::sync::RwLock;
use tokio::time::{interval, MissedTickBehavior};
use tracing::{info, warn};

use crate::metrics::MetricsCollector;
use super::repository::{SiteConfigDataSource, SiteConfigRecord, SiteConfigRepositoryError};

const CACHE_NAME: &str = "site_config";
const HEALTH_CHECK_INTERVAL: StdDuration = StdDuration::from_secs(30);

#[derive(Clone, Copy, Debug)]
pub struct RefreshConfig {
    pub partial_refresh_interval: StdDuration,
    pub full_refresh_interval: StdDuration,
    pub stale_after: StdDuration,
}

impl Default for RefreshConfig {
    fn default() -> Self {
        Self {
            partial_refresh_interval: StdDuration::from_secs(30),
            full_refresh_interval: StdDuration::from_secs(180),
            stale_after: StdDuration::from_secs(300),
        }
    }
}

#[derive(Clone, Debug)]
pub struct SiteConfig {
    pub site_id: String,
    pub domain: String,
    pub blacklisted_ips: Vec<String>,
    pub enforce_domain: bool,
    pub updated_at: DateTime<Utc>,
}

impl From<SiteConfigRecord> for SiteConfig {
    fn from(record: SiteConfigRecord) -> Self {
        Self {
            site_id: record.site_id,
            domain: record.domain,
            blacklisted_ips: record.blacklisted_ips,
            enforce_domain: record.enforce_domain,
            updated_at: record.updated_at,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SiteConfigError {
    #[error(transparent)]
    Repository(#[from] SiteConfigRepositoryError),
}

pub struct SiteConfigCache {
    configs: ArcSwap<HashMap<String, Arc<SiteConfig>>>,
    data_source: Arc<dyn SiteConfigDataSource>,
    metrics: Option<Arc<MetricsCollector>>,
    refresh_config: RefreshConfig,
    last_full_refresh_at: RwLock<Option<DateTime<Utc>>>,
    last_seen_updated_at: RwLock<Option<DateTime<Utc>>>,
    last_refresh_success_at: RwLock<Option<DateTime<Utc>>>,
}

impl SiteConfigCache {
    pub async fn initialize(
        data_source: Arc<dyn SiteConfigDataSource>,
        refresh_config: RefreshConfig,
        metrics: Option<Arc<MetricsCollector>>,
    ) -> Result<Arc<Self>, SiteConfigError> {
        Self::new_internal(data_source, refresh_config, metrics, true).await
    }

    async fn new_internal(
        data_source: Arc<dyn SiteConfigDataSource>,
        refresh_config: RefreshConfig,
        metrics: Option<Arc<MetricsCollector>>,
        spawn_tasks: bool,
    ) -> Result<Arc<Self>, SiteConfigError> {
        let cache = Arc::new(Self {
            configs: ArcSwap::from_pointee(HashMap::new()),
            data_source,
            metrics,
            refresh_config,
            last_full_refresh_at: RwLock::new(None),
            last_seen_updated_at: RwLock::new(None),
            last_refresh_success_at: RwLock::new(None),
        });

        cache.perform_full_refresh().await?;
        if spawn_tasks {
            cache.spawn_refresh_tasks();
        }
        Ok(cache)
    }

    pub fn get(&self, site_id: &str) -> Option<Arc<SiteConfig>> {
        let map = self.configs.load();
        let cfg = map.get(site_id).cloned();
        if let Some(metrics) = &self.metrics {
            metrics.increment_cache_lookup(
                CACHE_NAME,
                if cfg.is_some() { "hit" } else { "miss" },
            );
        }
        cfg
    }

    async fn perform_full_refresh(&self) -> Result<(), SiteConfigError> {
        let records = self.data_source.fetch_all_configs().await?;
        let count = records.len();
        let max_updated = records.iter().map(|r| r.updated_at).max();

        let mut new_map: HashMap<String, Arc<SiteConfig>> = HashMap::with_capacity(count);
        for record in &records {
            new_map.insert(
                record.site_id.clone(),
                Arc::new(SiteConfig::from(record.clone())),
            );
        }
        self.configs.store(Arc::new(new_map));
        *self.last_full_refresh_at.write().await = Some(Utc::now());
        self.update_last_seen(max_updated).await;
        self.mark_refresh_success().await;
        info!(count = count, "site-config cache fully refreshed");
        Ok(())
    }

    async fn perform_partial_refresh(&self) -> Result<(), SiteConfigError> {
        let since = self
            .last_seen_updated_at
            .read()
            .await
            .unwrap_or_else(epoch_timestamp);
    
        let updates = self
            .data_source
            .fetch_configs_updated_since(since)
            .await?;
    
        if updates.is_empty() {
            self.mark_refresh_success().await;
            return Ok(());
        }
    
        let max_updated = updates.iter().map(|r| r.updated_at).max();
    
        self.configs.rcu(|current| {
            let mut new_map = (**current).clone();
    
            for record in &updates {
                new_map.insert(
                    record.site_id.clone(),
                    Arc::new(SiteConfig::from(record.clone())),
                );
            }
    
            Arc::new(new_map)
        });
    
        let updated = updates.len();
        self.update_last_seen(max_updated).await;
        self.mark_refresh_success().await;
        info!(updated = updated, "site-config cache partially refreshed");
        Ok(())
    }

    async fn mark_refresh_success(&self) {
        let now = Utc::now();
        *self.last_refresh_success_at.write().await = Some(now);
        if let Some(metrics) = &self.metrics {
            metrics.set_site_config_last_refresh_timestamp_seconds(now.timestamp() as f64);
            metrics.set_site_config_cache_healthy(true);

            let current = self.configs.load();
            metrics.set_site_config_cache_entries(current.len() as f64);
        }
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
        tokio::spawn(Self::partial_refresh_loop(Arc::clone(self)));
        tokio::spawn(Self::full_refresh_loop(Arc::clone(self)));
        tokio::spawn(Self::health_monitor_loop(Arc::clone(self)));
    }

    async fn partial_refresh_loop(this: Arc<Self>) {
        let mut ticker = interval(this.refresh_config.partial_refresh_interval);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            if let Err(err) = this.perform_partial_refresh().await {
                this.handle_refresh_error("partial", err).await;
            }
        }
    }

    async fn full_refresh_loop(this: Arc<Self>) {
        let mut ticker = interval(this.refresh_config.full_refresh_interval);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            if let Err(err) = this.perform_full_refresh().await {
                this.handle_refresh_error("full", err).await;
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

    async fn handle_refresh_error(&self, stage: &str, err: SiteConfigError) {
        warn!(stage = stage, error = ?err, "site-config cache refresh failed");
        if let Some(metrics) = &self.metrics {
            metrics.set_site_config_cache_healthy(false);
        }
    }

    async fn evaluate_health(&self) {
        let stale_after = self.refresh_config.stale_after;
        if stale_after.is_zero() { return; }
        let healthy = {
            let last = self.last_refresh_success_at.read().await.clone();
            match last {
                Some(ts) => Utc::now()
                    .signed_duration_since(ts)
                    .to_std()
                    .map(|elapsed| elapsed <= stale_after)
                    .unwrap_or(false),
                None => false,
            }
        };

        if let Some(metrics) = &self.metrics {
            metrics.set_site_config_cache_healthy(healthy);
        }

        if !healthy {
            warn!(
                stale_seconds = stale_after.as_secs(),
                "site-config cache data is older than the allowed threshold"
            );
        }
    }
}

fn epoch_timestamp() -> DateTime<Utc> {
    Utc.timestamp_opt(0, 0).unwrap()
}


