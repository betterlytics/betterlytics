use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{info, warn};

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::jobqueue::{EmailGate, JobQueue};
use crate::metrics::MetricsCollector;
use crate::monitor::incident::IncidentStore;
use crate::notifications::NotificationEngine;
use crate::postgres::PostgresPool;

use super::alert::new_alert_history_writer;
use super::probe::DEFAULT_PROBE_TIMEOUT_MS;
use super::{
    new_monitor_writer, DomainRateLimiter, HttpRunner, HttpRuntimeConfig, IncidentOrchestrator,
    IncidentOrchestratorConfig, MonitorCache, MonitorCacheConfig, MonitorCheckDataSource,
    MonitorProbe, MonitorRepository, TlsRunner, TlsRuntimeConfig,
};

pub async fn spawn_monitoring(
    config: Arc<Config>,
    clickhouse: Arc<ClickHouseClient>,
    metrics: Option<Arc<MetricsCollector>>,
    notification_engine: Option<Arc<NotificationEngine>>,
) {
    super::init_dev_mode(config.is_development);

    let monitor_db_url = config
        .monitor_database_url
        .clone()
        .expect("MONITORING_DATABASE_URL must be set to a valid Postgres URL when ENABLE_UPTIME_MONITORING is true; set it or disable uptime monitoring");

    let job_queue_db_url = config
        .job_queue_database_url
        .clone()
        .expect("JOB_QUEUE_DATABASE_URL must be set to a valid Postgres URL when ENABLE_UPTIME_MONITORING is true");

    let monitor_pool = Arc::new(
        PostgresPool::new(&monitor_db_url, "betterlytics_monitor", 4)
            .await
            .expect("MONITORING_DATABASE_URL is not a valid Postgres URL"),
    );
    let job_queue_pool = Arc::new(
        PostgresPool::new(&job_queue_db_url, "betterlytics_job_queue", 2)
            .await
            .expect("JOB_QUEUE_DATABASE_URL is not a valid Postgres URL"),
    );
    let (monitor_ok, job_queue_ok) = tokio::join!(
        monitor_pool.check_connection(),
        job_queue_pool.check_connection()
    );
    monitor_ok.expect("Cannot reach Postgres via MONITORING_DATABASE_URL; check the URL, credentials, and that Postgres is up");
    job_queue_ok.expect("Cannot reach Postgres via JOB_QUEUE_DATABASE_URL; check the URL, credentials, and that Postgres is up");

    tokio::spawn(async move {
        run_monitoring_init_loop(
            config,
            monitor_pool,
            job_queue_pool,
            clickhouse,
            metrics,
            notification_engine,
        )
        .await;
    });
}

async fn run_monitoring_init_loop(
    config: Arc<Config>,
    monitor_pool: Arc<PostgresPool>,
    job_queue_pool: Arc<PostgresPool>,
    clickhouse: Arc<ClickHouseClient>,
    metrics: Option<Arc<MetricsCollector>>,
    notification_engine: Option<Arc<NotificationEngine>>,
) {
    const RETRY_DELAY_SECS: u64 = 30;
    let retry_delay = std::time::Duration::from_secs(RETRY_DELAY_SECS);

    loop {
        info!("uptime monitoring enabled; initializing monitor components");

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
                warn!(error = ?err, "Failed to create alert history writer; retrying");
                sleep(retry_delay).await;
                continue;
            }
        };

        let incident_store =
            match IncidentStore::new(Arc::clone(&clickhouse), &config.monitor_incidents_table) {
                Ok(store) => Some(store),
                Err(err) => {
                    warn!(error = ?err, "Failed to create incident store; retrying");
                    sleep(retry_delay).await;
                    continue;
                }
            };

        // A Postgres outage after boot surfaces per enqueue and the alert is retried on the next probe.
        let job_queue = Arc::new(JobQueue::new(
            Arc::clone(&job_queue_pool),
            EmailGate::from_config(&config),
        ));

        let incident_orchestrator = Arc::new(
            IncidentOrchestrator::new(
                IncidentOrchestratorConfig::from_config(&config),
                job_queue,
                history_writer,
                incident_store,
                notification_engine.clone(),
            )
            .await,
        );
        info!("Incident orchestrator initialized");

        let http_rate_limiter = Arc::new(DomainRateLimiter::default());
        let tls_rate_limiter = Arc::new(DomainRateLimiter::new(20, Duration::from_hours(1)));
        info!("Domain rate limiter initialized");

        let http_runner = HttpRunner::new(
            Arc::clone(&monitor_cache),
            probe,
            Arc::clone(&writer),
            metrics.clone(),
            Arc::clone(&incident_orchestrator),
            http_rate_limiter,
            HttpRuntimeConfig::default(),
        );

        let tls_runner = TlsRunner::new(
            tls_cache,
            tls_probe,
            tls_writer,
            metrics.clone(),
            Arc::clone(&incident_orchestrator),
            tls_rate_limiter,
            TlsRuntimeConfig::default(),
        );

        http_runner.spawn();
        tls_runner.spawn();

        info!("uptime monitoring started");
        break;
    }
}
