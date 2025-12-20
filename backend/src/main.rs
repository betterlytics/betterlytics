use axum::{
    Json, Router,
    extract::{ConnectInfo, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
};
use std::sync::Arc;
use std::{net::IpAddr, net::SocketAddr, str::FromStr};
use tokio::time::sleep;
use tower_http::cors::CorsLayer;
use tracing::{debug, error, info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use url::Url;

mod analytics;
mod bot_detection;
mod campaign;
mod clickhouse;
mod config;
mod db;
mod email;
mod geoip;
mod geoip_updater;
mod metrics;
mod monitor;
mod outbound_link;
mod postgres;
mod processing;
mod referrer;
mod session;
mod session_replay;
mod site_config;
mod storage;
mod ua_parser;
mod url_utils;
mod utils;
mod validation;

use analytics::{AnalyticsEvent, RawTrackingEvent, generate_site_id};
use clickhouse::ClickHouseClient;
use db::{Database, SharedDatabase};
use geoip::GeoIpService;
use geoip_updater::GeoIpUpdater;
use metrics::MetricsCollector;
use monitor::{
    AlertService, AlertServiceConfig,
    IncidentStore, MonitorCache, MonitorCacheConfig, MonitorCheckDataSource, MonitorProbe,
    MonitorRepository, HttpRunner, HttpRuntimeConfig, MonitorWriter, TlsRunner,
    TlsRuntimeConfig, init_dev_mode,
};
use monitor::alert::AlertHistoryRepository;
use postgres::PostgresPool;
use processing::EventProcessor;
use site_config::{RefreshConfig, SiteConfigCache, SiteConfigDataSource, SiteConfigRepository};
use storage::s3::S3Service;
use validation::{EventValidator, ValidationConfig};

#[tokio::main]
async fn main() {
    let config = Arc::new(config::Config::new());

    let log_filter_spec = format!(
        "{},tokio_postgres=info,hyper_util=info,rustls=info",
        config.log_level
    );

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(log_filter_spec))
        .with(tracing_subscriber::fmt::layer())
        .init();

    referrer::initialize(&config.referrer_db_path);

    ua_parser::initialize(&config.ua_regexes_path);

    let ip_addr = config
        .server_host
        .parse::<std::net::IpAddr>()
        .map_err(|e| {
            format!(
                "Invalid server host IP address '{}': {}",
                config.server_host, e
            )
        })
        .expect("Failed to parse server host IP address");

    let addr = SocketAddr::from((ip_addr, config.server_port));
    info!("Server starting on {}", addr);

    let (updater, geoip_watch_rx) =
        GeoIpUpdater::new(config.clone()).expect("Failed to create GeoIP updater");
    let updater = Arc::new(updater);

    let geoip_service = GeoIpService::new(config.clone(), geoip_watch_rx)
        .expect("Failed to initialize GeoIP service");

    let _updater_handle = tokio::spawn(Arc::clone(&updater).run());

    let validation_config = ValidationConfig::default();
    let validator = Arc::new(EventValidator::new(validation_config));

    let clickhouse = Arc::new(ClickHouseClient::new(&config));
    info!("ClickHouse client initialized");

    let db = Database::new(Arc::clone(&clickhouse), config.clone())
        .await
        .expect("Failed to initialize database");
    db.validate_schema().await.expect("Invalid database schema");
    let db = Arc::new(db);

    let metrics_collector = if config.enable_monitoring {
        let collector = MetricsCollector::new()
            .expect("Failed to initialize metrics collector")
            .start_system_metrics_updater();
        info!("Metrics collector started");
        Some(collector)
    } else {
        info!("Metrics collection disabled");
        None
    };

    let (processor, mut processed_rx) = EventProcessor::new(geoip_service);
    let processor = Arc::new(processor);

    let site_config_pool = Arc::new(
        PostgresPool::new(
            &config.site_config_database_url,
            "betterlytics_site_config",
            5,
        )
        .await
        .expect("Failed to create site-config PostgreSQL pool"),
    );
    let site_config_repo: Arc<dyn SiteConfigDataSource> = Arc::new(
        SiteConfigRepository::new(Arc::clone(&site_config_pool)),
    );

    let refresh_config = RefreshConfig::default();

    let site_cfg_cache =
        SiteConfigCache::initialize(site_config_repo, refresh_config, metrics_collector.clone())
            .await
            .expect("Failed to init SiteConfigCache");

    if config.enable_uptime_monitoring {
        init_dev_mode(config.is_development);
        
        let config_for_monitor = config.clone();
        let metrics_for_monitor = metrics_collector.clone();
        let clickhouse_for_monitor = Arc::clone(&clickhouse);
        tokio::spawn(async move {
            let retry_delay = std::time::Duration::from_secs(30);
            loop {
                info!("uptime monitoring enabled; initializing monitor components");
                let monitor_db_url = match config_for_monitor.monitor_database_url.as_ref() {
                    Some(url) => url.clone(),
                    None => {
                        warn!("MONITORING_DATABASE_URL not set; cannot start uptime monitoring");
                        return;
                    }
                };

                let monitor_pool = match PostgresPool::new(
                    &monitor_db_url,
                    "betterlytics_monitor",
                    4,
                )
                .await
                {
                    Ok(pool) => Arc::new(pool),
                    Err(err) => {
                        warn!(
                            error = ?err,
                            dsn_info = %monitor_db_url_safe(&monitor_db_url),
                            "Failed to create monitor PostgreSQL pool; retrying"
                        );
                        sleep(retry_delay).await;
                        continue;
                    }
                };

                let monitor_repo: Arc<dyn MonitorCheckDataSource> = Arc::new(
                    MonitorRepository::new(Arc::clone(&monitor_pool)),
                );

                let monitor_cache = match MonitorCache::initialize(
                    monitor_repo,
                    MonitorCacheConfig::default(),
                    metrics_for_monitor.clone(),
                )
                .await
                {
                    Ok(cache) => cache,
                    Err(err) => {
                        warn!(
                            error = ?err,
                            dsn_info = %monitor_db_url_safe(&monitor_db_url),
                            "Failed to init MonitorCache; retrying"
                        );
                        sleep(retry_delay).await;
                        continue;
                    }
                };

                let probe = match MonitorProbe::new(std::time::Duration::from_millis(
                    monitor::probe::DEFAULT_PROBE_TIMEOUT_MS,
                )) {
                    Ok(p) => p,
                    Err(err) => {
                        warn!(error = ?err, "Failed to init monitor probe; retrying");
                        sleep(retry_delay).await;
                        continue;
                    }
                };

                let writer = match MonitorWriter::new(
                    Arc::clone(&clickhouse_for_monitor),
                    &config_for_monitor.monitor_clickhouse_table,
                ) {
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

                let history_writer = AlertHistoryRepository::new(Arc::clone(&monitor_pool));
                info!("Alert history repository initialized");

                // Initialize alert service (email config from env, alert config from MonitorCheck)
                let incident_store = match IncidentStore::new(
                    Arc::clone(&clickhouse_for_monitor),
                    &config_for_monitor.monitor_incidents_table,
                ) {
                    Ok(store) => Some(store),
                    Err(err) => {
                        warn!(error = ?err, "Failed to create incident store; incident snapshots will not be recorded");
                        None
                    }
                };

                let alert_service = Arc::new(AlertService::new(
                    AlertServiceConfig::from_config(&config_for_monitor),
                    Some(history_writer),
                    incident_store,
                ).await);
                info!("Alert service initialized");

                let mut http_runner = HttpRunner::new(
                    Arc::clone(&monitor_cache),
                    probe,
                    Arc::clone(&writer),
                    metrics_for_monitor.clone(),
                    HttpRuntimeConfig::default(),
                );
                
                let mut tls_runner = TlsRunner::new(
                    tls_cache,
                    tls_probe,
                    tls_writer,
                    metrics_for_monitor.clone(),
                    TlsRuntimeConfig::default(),
                );

                // Wire up alert service
                http_runner = http_runner.with_alert_service(Arc::clone(&alert_service));
                tls_runner = tls_runner.with_alert_service(Arc::clone(&alert_service));

                http_runner.spawn();
                tls_runner.spawn();

                info!("uptime monitoring started");
                break;
            }
        });
    } else {
        info!("uptime monitoring disabled by configuration");
    }

    // Initialize optional S3 service for session replay storage
    let s3_service: Option<Arc<S3Service>> = match S3Service::from_config(config.clone()).await {
        Ok(Some(svc)) => {
            info!("S3 session storage enabled");
            Some(Arc::new(svc))
        }
        Ok(None) => {
            info!("S3 session storage disabled");
            None
        }
        Err(e) => {
            warn!("Failed to initialize S3 service: {}", e);
            None
        }
    };

    let db_clone = db.clone();
    tokio::spawn(async move {
        while let Some(processed) = processed_rx.recv().await {
            if let Err(e) = db_clone.insert_event(processed).await {
                tracing::error!("Failed to insert processed event: {}", e);
            }
        }
    });

	let mut router = Router::new()
		.route("/health", get(health_check))
		.route("/event", post(track_event))
		.route("/track", post(track_event)) // Deprecated: use /event instead
		.route("/site-id", get(generate_site_id_handler))
		.route("/metrics", get(metrics_handler));

    if config.enable_session_replay {
        router = router
            .route(
                "/replay/presign/put",
                post(session_replay::presign_put_segment),
            )
            .route(
                "/replay/finalize",
                post(session_replay::finalize_session_replay),
            );
    } else {
        info!("Session replay endpoints disabled by configuration");
    }

    let app = router
        .fallback(fallback_handler)
        .with_state((
            db,
            processor,
            metrics_collector,
            validator,
            s3_service,
            site_cfg_cache.clone(),
        ))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}

fn monitor_db_url_safe(raw: &str) -> String {
    if let Ok(url) = Url::parse(raw) {
        let user = url.username();
        let host = url.host_str().unwrap_or("<host?>");
        let port = url.port().map(|p| p.to_string()).unwrap_or_default();
        let db = url.path().trim_start_matches('/').to_string();
        let masked = format!(
            "{}@{}{}{}",
            if user.is_empty() { "<user?>" } else { user },
            host,
            if port.is_empty() {
                "".to_string()
            } else {
                format!(":{}", port)
            },
            if db.is_empty() {
                "".to_string()
            } else {
                format!("/{}", db)
            }
        );
        masked
    } else {
        "<invalid-url>".to_string()
    }
}

async fn health_check(
    State((db, _, _, _, _, _)): State<(
        SharedDatabase,
        Arc<EventProcessor>,
        Option<Arc<MetricsCollector>>,
        Arc<EventValidator>,
        Option<Arc<S3Service>>,
        Arc<SiteConfigCache>,
    )>,
) -> Result<impl IntoResponse, String> {
    match db.check_connection().await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "ok",
            "database": "connected"
        }))),
        Err(e) => {
            error!("Database health check failed: {}", e);
            Err(format!("Database connection failed: {}", e))
        }
    }
}

async fn track_event(
    State((_db, processor, metrics, validator, _s3, site_cfg_cache)): State<(
        SharedDatabase,
        Arc<EventProcessor>,
        Option<Arc<MetricsCollector>>,
        Arc<EventValidator>,
        Option<Arc<S3Service>>,
        Arc<SiteConfigCache>,
    )>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(raw_event): Json<RawTrackingEvent>,
) -> Result<StatusCode, (StatusCode, String)> {
    let start_time = std::time::Instant::now();

    let ip_address = parse_ip(headers).unwrap_or(addr.ip()).to_string();

    let validation_start = std::time::Instant::now();

    // Validate and sanitize event
    let validated_event = match validator
        .validate_event(raw_event, ip_address.clone())
        .await
    {
        Ok(validated) => validated,
        Err(e) => {
            debug!(reason = %validator.get_rejection_reason(&e), "validation failed");
            if let Some(metrics_collector) = &metrics {
                metrics_collector.increment_events_rejected(&validator.get_rejection_reason(&e));
            }

            warn!("Event validation failed: {}", e);

            let status = match &e {
                validation::ValidationError::PayloadTooLarge(_) => StatusCode::PAYLOAD_TOO_LARGE,
                _ => StatusCode::BAD_REQUEST,
            };

            return Err((status, e.to_string()));
        }
    };

    if let Some(metrics_collector) = &metrics {
        metrics_collector.record_validation_duration(validation_start.elapsed());
    }

    let site_policy_result = validation::validate_site_policies(
        &site_cfg_cache,
        &validated_event.raw.site_id,
        &validated_event.raw.url,
        &validated_event.ip_address,
    )
    .await;

    if let Err(e) = site_policy_result {
        debug!(reason = %validator.get_rejection_reason(&e), "site-config validation failed");
        if let Some(metrics_collector) = &metrics {
            metrics_collector.increment_events_rejected(&validator.get_rejection_reason(&e));
        }
        return Err((StatusCode::FORBIDDEN, e.to_string()));
    }

    debug!("validation passed");

    let event = AnalyticsEvent::new(validated_event.raw, validated_event.ip_address);

    if let Err(e) = processor.process_event(event).await {
        error!("Failed to process validated event: {}", e);
        return Ok(StatusCode::OK);
    }

    if let Some(metrics_collector) = metrics {
        let processing_duration = start_time.elapsed();
        metrics_collector.increment_events_processed();
        metrics_collector.record_processing_duration(processing_duration);
    }

    Ok(StatusCode::OK)
}

async fn metrics_handler(
    State((_, _, metrics, _, _, _)): State<(
        SharedDatabase,
        Arc<EventProcessor>,
        Option<Arc<MetricsCollector>>,
        Arc<EventValidator>,
        Option<Arc<S3Service>>,
        Arc<SiteConfigCache>,
    )>,
) -> impl IntoResponse {
    match metrics {
        Some(metrics_collector) => match metrics_collector.export_metrics() {
            Ok(metrics_str) => (StatusCode::OK, metrics_str),
            Err(e) => {
                error!("Failed to export metrics: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to export metrics".to_string(),
                )
            }
        },
        None => (StatusCode::NOT_FOUND, "Metrics disabled".to_string()),
    }
}

async fn fallback_handler() -> impl IntoResponse {
    warn!("Request to unknown route");
    (StatusCode::NOT_FOUND, "Not found")
}

pub fn parse_ip(headers: HeaderMap) -> Result<IpAddr, ()> {
    // Get IP from X-Forwarded-For header
    if let Some(forwarded_for) = headers.get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            if let Some(first_ip) = forwarded_str.split(',').next() {
                if let Ok(ip) = IpAddr::from_str(first_ip.trim()) {
                    return Ok(ip);
                }
            }
        }
    }

    Err(())
}

/// Temporary endpoint to generate a site ID
async fn generate_site_id_handler() -> impl IntoResponse {
    Json(generate_site_id())
}
