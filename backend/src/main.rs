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

use analytics::{AnalyticsEvent, RawTrackingEvent, generate_site_id};
use db::{Database, SharedDatabase};
use processing::EventProcessor;
use geoip::GeoIpService;
use geoip_updater::GeoIpUpdater;

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
        .with_state((db, processor))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn health_check(
    State((db, _)): State<(SharedDatabase, Arc<EventProcessor>)>,
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
    State((_db, processor)): State<(SharedDatabase, Arc<EventProcessor>)>,
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

    if let Err(e) = processor.process_event(event).await {
        error!("Failed to process event: {}", e);
        return Ok(StatusCode::OK);
    }

    Ok(StatusCode::OK)
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