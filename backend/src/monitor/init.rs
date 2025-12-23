//! Monitoring subsystem initialization.
//!
//! This module encapsulates all the setup logic for the uptime monitoring
//! feature, keeping `main.rs` clean.

use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{info, warn};

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::metrics::MetricsCollector;
use crate::monitor::incident::IncidentStore;
use crate::postgres::PostgresPool;

use super::alert::new_alert_history_writer;
use super::probe::DEFAULT_PROBE_TIMEOUT_MS;
use super::{
    DomainRateLimiter, HttpRunner, HttpRuntimeConfig, IncidentOrchestrator,
    IncidentOrchestratorConfig, MonitorCache, MonitorCacheConfig, MonitorCheckDataSource,
    MonitorProbe, MonitorRepository, TlsRunner, TlsRuntimeConfig, new_monitor_writer,
};

/// Spawns the uptime monitoring subsystem in a background task.
///
/// This handles all initialization with retry logic, including:
/// - PostgreSQL pool for monitor metadata
/// - Monitor cache for in-memory check schedules
/// - HTTP and TLS runners for performing checks
/// - Alert service for notifications
///
/// The function returns immediately after spawning; initialization happens
/// asynchronously with automatic retries on failure.
pub fn spawn_monitoring(
    config: Arc<Config>,
    clickhouse: Arc<ClickHouseClient>,
    metrics: Option<Arc<MetricsCollector>>,
) {
    super::init_dev_mode(config.is_development);

    tokio::spawn(async move {
        run_monitoring_init_loop(config, clickhouse, metrics).await;
    });
}

async fn run_monitoring_init_loop(
    config: Arc<Config>,
    clickhouse: Arc<ClickHouseClient>,
    metrics: Option<Arc<MetricsCollector>>,
) {
    const RETRY_DELAY_SECS: u64 = 30;
    let retry_delay = std::time::Duration::from_secs(RETRY_DELAY_SECS);

    loop {
        info!("uptime monitoring enabled; initializing monitor components");

        let monitor_db_url = match config.monitor_database_url.as_ref() {
            Some(url) => url.clone(),
            None => {
                warn!("MONITORING_DATABASE_URL not set; cannot start uptime monitoring");
                return;
            }
        };

        let monitor_pool = match PostgresPool::new(&monitor_db_url, "betterlytics_monitor", 4).await
        {
            Ok(pool) => Arc::new(pool),
            Err(err) => {
                warn!(error = ?err, "Failed to create monitor PostgreSQL pool; retrying");
                sleep(retry_delay).await;
                continue;
            }
        };

        let monitor_repo: Arc<dyn MonitorCheckDataSource> =
            Arc::new(MonitorRepository::new(Arc::clone(&monitor_pool)));

        let monitor_cache = match MonitorCache::initialize(
            monitor_repo,
            MonitorCacheConfig::default(),
            metrics.clone(),
        )
        .await
        {
            Ok(cache) => cache,
            Err(err) => {
                warn!(error = ?err, "Failed to init MonitorCache; retrying");
                sleep(retry_delay).await;
                continue;
            }
        };

        let probe =
            match MonitorProbe::new(std::time::Duration::from_millis(DEFAULT_PROBE_TIMEOUT_MS)) {
                Ok(p) => p,
                Err(err) => {
                    warn!(error = ?err, "Failed to init monitor probe; retrying");
                    sleep(retry_delay).await;
                    continue;
                }
            };

        let writer =
            match new_monitor_writer(Arc::clone(&clickhouse), &config.monitor_clickhouse_table) {
                Ok(w) => w,
                Err(err) => {
                    warn!(error = ?err, "Failed to create monitor writer; retrying");
                    sleep(retry_delay).await;
                    continue;
                }
            };

        let tls_probe = probe.clone();
        let tls_writer = Arc::clone(&writer);
        let tls_cache = Arc::clone(&monitor_cache);

        let history_writer = match new_alert_history_writer(
            Arc::clone(&clickhouse),
            "analytics.monitor_alert_history",
        ) {
            Ok(w) => Some(w),
            Err(err) => {
                warn!(error = ?err, "Failed to create alert history writer; alerts will not be recorded");
                None
            }
        };

        let incident_store = match IncidentStore::new(
            Arc::clone(&clickhouse),
            &config.monitor_incidents_table,
        ) {
            Ok(store) => Some(store),
            Err(err) => {
                warn!(error = ?err, "Failed to create incident store; incident snapshots will not be recorded");
                None
            }
        };

        let incident_orchestrator = Arc::new(
            IncidentOrchestrator::new(
                IncidentOrchestratorConfig::from_config(&config),
                history_writer,
                incident_store,
            )
            .await,
        );
        info!("Incident orchestrator initialized");

        let http_rate_limiter = Arc::new(DomainRateLimiter::default()); // 10 reqs per min
        let tls_rate_limiter = Arc::new(DomainRateLimiter::new(20, Duration::from_hours(1)));
        info!("Domain rate limiter initialized");

        let mut http_runner = HttpRunner::new(
            Arc::clone(&monitor_cache),
            probe,
            Arc::clone(&writer),
            metrics.clone(),
            HttpRuntimeConfig::default(),
        );

        let mut tls_runner = TlsRunner::new(
            tls_cache,
            tls_probe,
            tls_writer,
            metrics.clone(),
            TlsRuntimeConfig::default(),
        );

        http_runner = http_runner
            .with_incident_orchestrator(Arc::clone(&incident_orchestrator))
            .with_rate_limiter(Arc::clone(&http_rate_limiter));
        tls_runner = tls_runner
            .with_incident_orchestrator(Arc::clone(&incident_orchestrator))
            .with_rate_limiter(Arc::clone(&tls_rate_limiter));

        http_runner.spawn();
        tls_runner.spawn();

        info!("uptime monitoring started");
        break;
    }
}
