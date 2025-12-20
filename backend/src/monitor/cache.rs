use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration as StdDuration;

use arc_swap::ArcSwap;
use chrono::{DateTime, TimeZone, Utc};
use tokio::sync::RwLock;
use tokio::time::{MissedTickBehavior, interval};
use tracing::{info, warn};

use crate::metrics::MetricsCollector;
use crate::monitor::{MonitorCheck, MonitorCheckDataSource};

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
            partial_refresh_interval: PARTIAL_REFRESH_INTERVAL,
            full_refresh_interval: FULL_REFRESH_INTERVAL,
            stale_after: STALE_AFTER,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum MonitorCacheError {
    #[error(transparent)]
    Repository(#[from] crate::monitor::repository::MonitorRepositoryError),
}

pub struct MonitorCache {
    checks: ArcSwap<HashMap<String, Arc<MonitorCheck>>>,
    data_source: Arc<dyn MonitorCheckDataSource>,
    metrics: Option<Arc<MetricsCollector>>,
    refresh_config: RefreshConfig,
    last_full_refresh_at: RwLock<Option<DateTime<Utc>>>,
    last_seen_updated_at: RwLock<Option<DateTime<Utc>>>,
    last_refresh_success_at: RwLock<Option<DateTime<Utc>>>,
}

impl MonitorCache {
    pub async fn initialize(
        data_source: Arc<dyn MonitorCheckDataSource>,
        refresh_config: RefreshConfig,
        metrics: Option<Arc<MetricsCollector>>,
    ) -> Result<Arc<Self>, MonitorCacheError> {
        info!(
            partial_refresh_secs = refresh_config.partial_refresh_interval.as_secs(),
            full_refresh_secs = refresh_config.full_refresh_interval.as_secs(),
            stale_after_secs = refresh_config.stale_after.as_secs(),
            "initializing monitor cache"
        );
        Self::new_internal(data_source, refresh_config, metrics, true).await
    }

    async fn new_internal(
        data_source: Arc<dyn MonitorCheckDataSource>,
        refresh_config: RefreshConfig,
        metrics: Option<Arc<MetricsCollector>>,
        spawn_tasks: bool,
    ) -> Result<Arc<Self>, MonitorCacheError> {
        let cache = Arc::new(Self {
            checks: ArcSwap::from_pointee(HashMap::new()),
            data_source,
            metrics,
            refresh_config,
            last_full_refresh_at: RwLock::new(None),
            last_seen_updated_at: RwLock::new(None),
            last_refresh_success_at: RwLock::new(None),
        });

        cache.perform_full_refresh().await?;
        if spawn_tasks {
            info!("spawning monitor cache refresh tasks");
            cache.spawn_refresh_tasks();
        }
        Ok(cache)
    }

    pub fn snapshot(&self) -> Vec<Arc<MonitorCheck>> {
        let map = self.checks.load();
        map.values().cloned().collect()
    }

    async fn perform_full_refresh(&self) -> Result<(), MonitorCacheError> {
        let records = self.data_source.fetch_all_checks().await?;
        let count = records.len();
        let max_updated = records.iter().map(|r| r.updated_at).max();

        let mut new_map: HashMap<String, Arc<MonitorCheck>> = HashMap::with_capacity(count);
        for check in &records {
            new_map.insert(check.id.clone(), Arc::new(check.clone()));
        }
        self.checks.store(Arc::new(new_map));
        *self.last_full_refresh_at.write().await = Some(Utc::now());
        self.update_last_seen(max_updated).await;
        self.mark_refresh_success(count).await;
        log_cache_state(&self.checks.load());
        if count == 0 {
            warn!("monitor cache full refresh loaded zero checks");
        }
        info!(count = count, "monitor cache fully refreshed");
        Ok(())
    }

    async fn perform_partial_refresh(&self) -> Result<(), MonitorCacheError> {
        let since = self
            .last_seen_updated_at
            .read()
            .await
            .unwrap_or_else(epoch_timestamp);

        let updates = self.data_source.fetch_checks_updated_since(since).await?;

        if updates.is_empty() {
            self.mark_refresh_success(self.checks.load().len()).await;
            return Ok(());
        }

        let max_updated = updates.iter().map(|r| r.updated_at).max();

        self.checks.rcu(|current| {
            let mut new_map = (**current).clone();

            for check in &updates {
                new_map.insert(check.id.clone(), Arc::new(check.clone()));
            }

            Arc::new(new_map)
        });

        let updated = updates.len();
        let total = self.checks.load().len();
        self.update_last_seen(max_updated).await;
        self.mark_refresh_success(total).await;
        log_cache_state(&self.checks.load());
        info!(
            updated = updated,
            total = total,
            "monitor cache partially refreshed"
        );
        Ok(())
    }

    async fn mark_refresh_success(&self, count: usize) {
        let now = Utc::now();
        *self.last_refresh_success_at.write().await = Some(now);
        if let Some(metrics) = &self.metrics {
            metrics.set_monitor_cache_last_refresh_timestamp_seconds(now.timestamp() as f64);
            metrics.set_monitor_cache_healthy(true);
            metrics.set_monitor_cache_entries(count as f64);
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
        Self::spawn_supervised("partial_refresh", Arc::clone(self), Self::partial_refresh_loop);
        Self::spawn_supervised("full_refresh", Arc::clone(self), Self::full_refresh_loop);
        Self::spawn_supervised("health_monitor", Arc::clone(self), Self::health_monitor_loop);
    }

    /// Spawn a task with automatic restart supervision.
    fn spawn_supervised<F, Fut>(name: &'static str, this: Arc<Self>, task_fn: F)
    where
        F: Fn(Arc<Self>) -> Fut + Send + 'static,
        Fut: std::future::Future<Output = ()> + Send + 'static,
    {
        tokio::spawn(async move {
            let mut restart_count: u32 = 0;
            const MAX_BACKOFF_SECS: u64 = 60;
            const BASE_BACKOFF_SECS: u64 = 1;

            loop {
                info!(task = name, restart_count, "Starting monitor cache task");
                
                task_fn(Arc::clone(&this)).await;

                // If we get here, the loop exited unexpectedly
                restart_count = restart_count.saturating_add(1);
                let backoff_secs = (BASE_BACKOFF_SECS << restart_count.min(6)).min(MAX_BACKOFF_SECS);

                tracing::error!(
                    task = name,
                    restart_count,
                    backoff_secs,
                    "Monitor cache task exited unexpectedly - restarting after backoff"
                );

                tokio::time::sleep(StdDuration::from_secs(backoff_secs)).await;
            }
        });
    }

    async fn partial_refresh_loop(this: Arc<Self>) {
        let mut ticker = interval(this.refresh_config.partial_refresh_interval);
        ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
        // Wait one full interval before the first partial refresh; initial data load is handled during initialization.
        ticker.tick().await;
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
        // Wait one full interval before the first partial refresh; initial data load is handled during initialization.
        ticker.tick().await;
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

    async fn handle_refresh_error(&self, stage: &str, err: MonitorCacheError) {
        warn!(stage = stage, error = ?err, "monitor cache refresh failed");
        if let Some(metrics) = &self.metrics {
            metrics.set_monitor_cache_healthy(false);
        }
    }

    async fn evaluate_health(&self) {
        let stale_after = self.refresh_config.stale_after;
        if stale_after.is_zero() {
            return;
        }
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
            metrics.set_monitor_cache_healthy(healthy);
        }

        if !healthy {
            warn!(
                stale_seconds = stale_after.as_secs(),
                "monitor cache data is older than the allowed threshold"
            );
        }
    }
}

fn epoch_timestamp() -> DateTime<Utc> {
    Utc.timestamp_opt(0, 0).unwrap()
}

fn log_cache_state(map: &HashMap<String, Arc<MonitorCheck>>) {
    const MAX_IDS: usize = 10;
    let mut ids: Vec<&String> = map.keys().collect();
    ids.sort();
    let preview: Vec<&String> = ids.into_iter().take(MAX_IDS).collect();
    info!(
        total_entries = map.len(),
        preview = ?preview,
        "monitor cache state after refresh"
    );
}

const PARTIAL_REFRESH_INTERVAL: StdDuration = StdDuration::from_secs(30);
const FULL_REFRESH_INTERVAL: StdDuration = StdDuration::from_secs(180);
const STALE_AFTER: StdDuration = StdDuration::from_secs(300);
