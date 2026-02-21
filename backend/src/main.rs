use axum::{
    Json, Router,
    extract::{ConnectInfo, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
};
use std::sync::Arc;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing::{debug, error, info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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
mod notifications;
mod outbound_link;
mod postgres;
mod processing;
mod referrer;
mod session;
mod ip_parser;
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

    let validation_config = ValidationConfig {
        enforce_timestamp_validation: !config.is_development,
        ..Default::default()
    };
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

    let notification_engine = match crate::notifications::initialize_notification_engine(
        Arc::clone(&site_config_pool),
        Arc::clone(&clickhouse),
        &config,
    )
    .await
    {
        Ok(engine) => {
            info!("Notification engine initialized");
            Some(engine)
        }
        Err(err) => {
            warn!(error = ?err, "Failed to initialize notification engine; continuing without push notifications");
            None
        }
    };

    if config.enable_uptime_monitoring {
        monitor::spawn_monitoring(
            config.clone(),
            Arc::clone(&clickhouse),
            metrics_collector.clone(),
            notification_engine,
        );
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

    let ip_address = ip_parser::parse_ip(&headers).unwrap_or(addr.ip()).to_string();

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


/// Temporary endpoint to generate a site ID
async fn generate_site_id_handler() -> impl IntoResponse {
    Json(generate_site_id())
}
