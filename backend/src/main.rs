use axum::{
    extract::{ConnectInfo, State}, http::{HeaderMap, StatusCode}, response::IntoResponse, routing::{get, post}, Json, Router
};
use std::sync::Arc;
use std::{net::SocketAddr, net::IpAddr, str::FromStr};
use tower_http::cors::CorsLayer;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod analytics;
mod db;
mod processing;
mod session;
mod geoip;
mod geoip_updater;
mod bot_detection;
mod referrer;
mod campaign;
mod ua_parser;
mod metrics;

use analytics::{AnalyticsEvent, RawTrackingEvent, generate_site_id};
use db::{Database, SharedDatabase};
use processing::EventProcessor;
use geoip::GeoIpService;
use geoip_updater::GeoIpUpdater;
use metrics::MetricsCollector;

#[tokio::main]
async fn main() {
    let config = Arc::new(config::Config::new());

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(&config.log_level))
        .with(tracing_subscriber::fmt::layer())
        .init();

    referrer::initialize(&config.referrer_db_path);

    ua_parser::initialize(&config.ua_regexes_path);

    let ip_addr = config.server_host.parse::<std::net::IpAddr>()
        .map_err(|e| format!("Invalid server host IP address '{}': {}", config.server_host, e))
        .expect("Failed to parse server host IP address");
    
    let addr = SocketAddr::from((ip_addr, config.server_port));
    info!("Server starting on {}", addr);

    let (updater, geoip_watch_rx) = GeoIpUpdater::new(config.clone())
        .expect("Failed to create GeoIP updater");
    let updater = Arc::new(updater);

    let geoip_service = GeoIpService::new(config.clone(), geoip_watch_rx)
        .expect("Failed to initialize GeoIP service");

    let _updater_handle = tokio::spawn(Arc::clone(&updater).run());

    let db = Database::new(config.clone()).await.expect("Failed to initialize database");
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

    let db_clone = db.clone();
    tokio::spawn(async move {
        while let Some(processed) = processed_rx.recv().await {
            if let Err(e) = db_clone.insert_event(processed).await {
                tracing::error!("Failed to insert processed event: {}", e);
            }
        }
    });

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/track", post(track_event))
        .route("/site-id", get(generate_site_id_handler))
        .route("/metrics", get(metrics_handler))
        .with_state((db, processor, metrics_collector))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn health_check(
    State((db, _, _)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>)>,
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
    State((_db, processor, metrics)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>)>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(raw_event): Json<RawTrackingEvent>,
) -> Result<StatusCode, (StatusCode, String)> {
    if raw_event.site_id.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "site_id is required".to_string()));
    }
    if raw_event.url.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "url is required".to_string()));
    }
    if raw_event.event_name.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "event name is required".to_string()));
    }

    let event = AnalyticsEvent::new(raw_event, parse_ip(headers).unwrap_or(addr.ip()).to_string());

    let start_time = std::time::Instant::now();
    if let Err(e) = processor.process_event(event).await {
        error!("Failed to process event: {}", e);
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
    State((_, _, metrics)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>)>,
) -> impl IntoResponse {
    match metrics {
        Some(metrics_collector) => {
            match metrics_collector.export_metrics() {
                Ok(metrics_str) => (StatusCode::OK, metrics_str),
                Err(e) => {
                    error!("Failed to export metrics: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to export metrics".to_string())
                }
            }
        }
        None => (StatusCode::NOT_FOUND, "Metrics disabled".to_string())
    }
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