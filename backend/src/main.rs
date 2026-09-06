use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use std::sync::Arc;
use std::net::SocketAddr;
use std::time::Duration;
use tower_http::cors::CorsLayer;
use tracing::{debug, error, info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod analytics;
mod asn;
mod bot_detection;
mod campaign;
mod clickhouse;
mod client_request;
mod config;
mod db;
mod error_fingerprint;
mod geoip;
mod geoip_updater;
mod metrics;
mod jobqueue;
mod monitor;
mod notifications;
mod outbound_link;
mod postgres;
mod processing;
mod referrer;
mod salt;
mod sanitize;
mod session;
mod ip_parser;
mod session_replay;
mod site_config;
mod storage;
mod ua_parser;
mod url_utils;
mod visitor;
mod utils;
mod validation;

use analytics::{AnalyticsEvent, RawTrackingEvent, generate_site_id};
use clickhouse::ClickHouseClient;
use client_request::ClientRequest;
use db::{Database, SharedDatabase};
use geoip::GeoIpService;
use geoip_updater::GeoIpUpdater;
use metrics::MetricsCollector;
use postgres::PostgresPool;
use config::ReplayStorage;
use processing::EventProcessor;
use session_replay::{MAX_UPLOAD_BODY_BYTES, ReplayCtx, store::SegmentStore};
use site_config::{RefreshConfig, SiteConfigCache, SiteConfigDataSource, SiteConfigRepository};
use storage::s3::S3Service;
use validation::{EventValidator, ValidationConfig};

/// Cap on draining buffered events to ClickHouse after the HTTP server stops.
/// The container stop grace period must comfortably exceed this.
const SHUTDOWN_DEADLINE: Duration = Duration::from_secs(5);

/// Hard backstop measured from signal receipt so shutdown never depends on
/// Docker's SIGKILL. Ordering invariant: SHUTDOWN_DEADLINE < WATCHDOG_TIMEOUT
/// < the container stop grace period (10s Docker default).
const WATCHDOG_TIMEOUT: Duration = Duration::from_secs(8);

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
    let geoip_reader = updater
        .bootstrap()
        .await
        .map_err(|e| format!("{e:#}"))
        .expect("Geolocation is enabled but no GeoIP database could be obtained");
    let geoip_service = GeoIpService::new(config.clone(), geoip_reader, geoip_watch_rx);
    let _updater_handle = tokio::spawn(Arc::new(updater).run());

    let asn_service = if config.enable_asn_lookup {
        let (asn_updater, asn_watch_rx) =
            GeoIpUpdater::new_asn(config.clone()).expect("Failed to create ASN updater");
        let asn_reader = asn_updater
            .bootstrap()
            .await
            .map_err(|e| format!("{e:#}"))
            .expect("ASN lookup is enabled but no ASN database could be obtained");
        tokio::spawn(Arc::new(asn_updater).run());
        Some(asn::AsnService::new(asn_reader, asn_watch_rx))
    } else {
        info!("ASN lookup disabled (set ENABLE_ASN_LOOKUP=true to enable)");
        None
    };

    bot_detection::warm();
    let validator = Arc::new(EventValidator::new(ValidationConfig::default()));

    let clickhouse = Arc::new(ClickHouseClient::new(&config));
    info!("ClickHouse client initialized");

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

    let (db, event_tx, bot_event_tx, inserter_handle, bot_inserter_handle) =
        Database::new(Arc::clone(&clickhouse), config.clone(), metrics_collector.clone())
            .await
            .expect("Failed to initialize database");

    if let Some(metrics) = metrics_collector.clone() {
        spawn_pressure_sampler(metrics, event_tx.downgrade());
    }
    db.validate_schema().await.expect("Invalid database schema");

    if let Err(e) = referrer::sync_referrer_categories(
        &db,
        &config.referrer_db_path,
        &config.ga4_source_categories_path,
        &config.custom_referrers_path,
    )
    .await
    {
        warn!(
            "Referrer category sync failed: {}. Using existing dictionary data.",
            e
        );
    }

    let db = Arc::new(db);

    let processor = Arc::new(EventProcessor::new(
        geoip_service,
        asn_service,
        event_tx,
        bot_event_tx,
        metrics_collector.clone(),
        config.is_development,
        config.enable_bot_event_log,
    ));

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

    // Initialize the secret rotating salt used to anonymize visitor fingerprints.
    // Uses a dedicated read-write Postgres role; loads (or creates) today's salt now so
    // the first event does not pay the rotation cost.
    let salts_pool = Arc::new(
        PostgresPool::new(&config.salts_database_url, "betterlytics_salts", 5)
            .await
            .expect("Failed to create salts PostgreSQL pool"),
    );
    salt::init(salts_pool)
        .await
        .expect("Failed to initialize salt service");

    if config.session_cache_warm_enabled {
        warm_session_cache(&db).await;
    }

    let refresh_config = RefreshConfig::default();

    let site_cfg_cache =
        SiteConfigCache::initialize(site_config_repo, refresh_config, metrics_collector.clone())
            .await
            .expect("Failed to init SiteConfigCache");

    let notification_engine = crate::notifications::initialize_notification_engine(
        Arc::clone(&site_config_pool),
        Arc::clone(&clickhouse),
        &config,
    )
    .await
    .expect("Failed to initialize notification engine");

    if config.enable_uptime_monitoring {
        monitor::spawn_monitoring(
            config.clone(),
            Arc::clone(&clickhouse),
            metrics_collector.clone(),
            Some(notification_engine),
        )
        .await;
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
        Err(e) => panic!("Failed to initialize S3 service: {}", e),
    };

    if config.enable_session_replay && config.replay_storage == ReplayStorage::S3 {
        info!("REPLAY_RETENTION_DAYS applies to ClickHouse data only; expire S3 objects under the 'site/' prefix with a bucket lifecycle rule");
    }

    // Built only when replay is enabled, so the config assert has already validated
    // the storage mode for this config.
    let replay_ctx = config.enable_session_replay.then(|| {
        let store = match config.replay_storage {
            ReplayStorage::S3 => SegmentStore::S3(s3_service.clone().expect("asserted by config validation")),
            ReplayStorage::ClickHouse => SegmentStore::ClickHouse(db.clone()),
        };
        Arc::new(ReplayCtx {
            mode: config.replay_storage,
            store,
        })
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
                "/replay/segment",
                post(session_replay::upload_segment)
                    // Overrides the app-wide 64 KB DefaultBodyLimit; segments are up to 5 MB compressed plus error metadata
                    .layer(DefaultBodyLimit::max(MAX_UPLOAD_BODY_BYTES as usize)),
            );
    } else {
        info!("Session replay endpoints disabled by configuration");
    }

    let app = router
        .fallback(fallback_handler)
        .layer(DefaultBodyLimit::max(64 * 1024))
        .with_state((
            db,
            processor,
            metrics_collector,
            validator,
            replay_ctx,
            site_cfg_cache.clone(),
        ))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    let mut inserter_handle = inserter_handle;
    let mut bot_inserter_handle = bot_inserter_handle;
    tokio::select! {
        result = axum::serve(
            listener,
            app.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .with_graceful_shutdown(shutdown_signal()) => result.unwrap(),
        // The inserters only return once their ingest channels close, so reaching
        // here means one panicked. Exit non-zero rather than keep acking events
        // into a dead channel; the container restart policy brings us back.
        result = &mut inserter_handle => {
            error!(?result, "Inserter task exited while the server is running, exiting");
            std::process::exit(1);
        }
        result = &mut bot_inserter_handle => {
            error!(?result, "Bot event inserter task exited while the server is running, exiting");
            std::process::exit(1);
        }
    }

    info!("HTTP server stopped, draining buffered data");
    let drain = async {
        match inserter_handle.await {
            Ok(()) => info!("Ingest pipeline drained, buffered events committed"),
            Err(e) => error!("Inserter task failed during drain: {}", e),
        }
        match bot_inserter_handle.await {
            Ok(()) => info!("Bot event pipeline drained"),
            Err(e) => error!("Bot event inserter task failed during drain: {}", e),
        }
        monitor::clickhouse_writer::flush_all_writers().await;
    };
    if tokio::time::timeout(SHUTDOWN_DEADLINE, drain).await.is_err() {
        error!(
            "Shutdown deadline of {:?} exceeded, exiting without a full drain",
            SHUTDOWN_DEADLINE
        );
        std::process::exit(1);
    }

    info!("Shutdown complete");
}

/// Resolves when SIGTERM (Unix) or Ctrl+C is received.
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => info!("Ctrl+C received, shutting down gracefully"),
        _ = terminate => info!("SIGTERM received, shutting down gracefully"),
    }

    tokio::spawn(async {
        tokio::time::sleep(WATCHDOG_TIMEOUT).await;
        error!(
            "Graceful shutdown did not complete within {:?}, forcing exit",
            WATCHDOG_TIMEOUT
        );
        std::process::exit(1);
    });
}

/// Holds only a weak channel handle, so the ingest channel still closes when
/// the processor drops at shutdown.
fn spawn_pressure_sampler(
    metrics: Arc<MetricsCollector>,
    ingest_tx: tokio::sync::mpsc::WeakSender<processing::ProcessedEvent>,
) {
    tokio::spawn(async move {
        let mut tick = tokio::time::interval(Duration::from_secs(5));
        loop {
            tick.tick().await;
            if let Some(tx) = ingest_tx.upgrade() {
                metrics.set_ingest_channel_depth(tx.max_capacity() - tx.capacity());
            }
            for (table, depth) in monitor::clickhouse_writer::writer_queue_depths() {
                metrics.set_writer_queue_depth(&table, depth);
            }
        }
    });
}

/// Warm the session cache from ClickHouse so in-flight sessions survive a restart
async fn warm_session_cache(db: &Database) {
    match db.fetch_active_sessions(session::SESSION_EXPIRY).await {
        Ok(rows) => {
            let warmed = session::warm(rows.into_iter().map(|r| session::WarmSession {
                site_id: r.site_id,
                visitor_fingerprint: r.visitor_id,
                session_id: r.session_id,
                created_at: r.session_created_at,
            }));
            info!("Warmed {} active sessions into the session cache", warmed);
        }
        Err(e) => warn!("Session cache warm failed (starting with empty cache): {}", e),
    }
}

async fn health_check(
    State((db, _, _, _, _, _)): State<(
        SharedDatabase,
        Arc<EventProcessor>,
        Option<Arc<MetricsCollector>>,
        Arc<EventValidator>,
        Option<Arc<ReplayCtx>>,
        Arc<SiteConfigCache>,
    )>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    match db.check_connection().await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "ok",
            "database": "connected"
        }))),
        Err(e) => {
            error!("Database health check failed: {}", e);
            Err((
                StatusCode::SERVICE_UNAVAILABLE,
                format!("Database connection failed: {}", e),
            ))
        }
    }
}

async fn track_event(
    State((_db, processor, metrics, validator, _replay_ctx, site_cfg_cache)): State<(
        SharedDatabase,
        Arc<EventProcessor>,
        Option<Arc<MetricsCollector>>,
        Arc<EventValidator>,
        Option<Arc<ReplayCtx>>,
        Arc<SiteConfigCache>,
    )>,
    client: ClientRequest,
    Json(mut raw_event): Json<RawTrackingEvent>,
) -> Result<StatusCode, (StatusCode, String)> {
    let start_time = std::time::Instant::now();
    let ip_address = client.ip.clone();

    sanitize::sanitize_event(&mut raw_event, &sanitize::SanitizeConfig::default());

    let validation_start = std::time::Instant::now();

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

    let event = AnalyticsEvent::new(
        validated_event.raw,
        validated_event.ip_address,
        client.user_agent,
        client.sec_ch_ua,
        client.prefetch,
    );

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
        Option<Arc<ReplayCtx>>,
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
