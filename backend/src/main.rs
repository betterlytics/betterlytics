use axum::{
    extract::{ConnectInfo, State}, http::{HeaderMap, StatusCode}, response::IntoResponse, routing::{get, post}, Json, Router
};
use std::sync::Arc;
use std::{net::SocketAddr, net::IpAddr, str::FromStr};
use tower_http::cors::CorsLayer;
use tracing::{info, error, warn};
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
mod outbound_link;
mod url_utils;
mod campaign;
mod ua_parser;
mod metrics;
mod validation;
mod storage;

use analytics::{AnalyticsEvent, RawTrackingEvent, generate_site_id};
use db::{Database, SharedDatabase};
use processing::EventProcessor;
use geoip::GeoIpService;
use geoip_updater::GeoIpUpdater;
use metrics::MetricsCollector;
use validation::{EventValidator, ValidationConfig};
use storage::s3::S3Service;

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

    let validation_config = ValidationConfig::default();
    let validator = Arc::new(EventValidator::new(validation_config));

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

    // Initialize optional S3 service for session replay storage
    let s3_service: Option<Arc<S3Service>> = match S3Service::from_config(config.clone()).await {
        Ok(Some(svc)) => {
            info!("S3 session storage enabled");
            Some(Arc::new(svc))
        },
        Ok(None) => {
            info!("S3 session storage disabled");
            None
        },
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


    let app = Router::new()
        .route("/health", get(health_check))
        .route("/track", post(track_event))
        .route("/site-id", get(generate_site_id_handler))
        // Session replay storage routes
        .route("/replay/presign/put", post(presign_put_segment))
        .route("/replay/presign/get", post(presign_get_segment))
        .route("/replay/finalize", post(finalize_session_replay))
        .route("/metrics", get(metrics_handler))
        .fallback(fallback_handler)
        .with_state((db, processor, metrics_collector, validator, s3_service))
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    info!("Listening on {}", addr);
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}

async fn health_check(
    State((db, _, _, _, _)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
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
    State((_db, processor, metrics, validator, _s3)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(raw_event): Json<RawTrackingEvent>,
) -> Result<StatusCode, (StatusCode, String)> {
    let start_time = std::time::Instant::now();
    
    let ip_address = parse_ip(headers).unwrap_or(addr.ip()).to_string();
    
    let validation_start = std::time::Instant::now();

    // Validate and sanitize event
    let validated_event = match validator.validate_event(raw_event, ip_address.clone()).await {
        Ok(validated) => validated,
        Err(e) => {
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
    State((_, _, metrics, _, _)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
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

#[derive(serde::Deserialize)]
struct PresignPutRequest {
    site_id: String,
    session_id: String,
    segment_idx: u32,
    content_type: Option<String>,
    content_encoding: Option<String>,
    ttl_secs: Option<u64>,
}

#[derive(serde::Serialize)]
struct PresignResponse { url: String, key: String }

async fn presign_put_segment(
    State((_, _, _, _, s3)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    Json(req): Json<PresignPutRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let s3 = s3.ok_or((StatusCode::SERVICE_UNAVAILABLE, "S3 not configured".to_string()))?;
    let key = s3.object_key_for_segment(&req.site_id, &req.session_id, req.segment_idx);
    let url = s3.presign_put(&key, req.content_type.as_deref().unwrap_or("application/json"), req.content_encoding.as_deref(), req.ttl_secs.unwrap_or(60)).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(PresignResponse { url, key }))
}

#[derive(serde::Deserialize)]
struct PresignGetRequest { key: String, ttl_secs: Option<u64> }

async fn presign_get_segment(
    State((_, _, _, _, s3)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    Json(req): Json<PresignGetRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let s3 = s3.ok_or((StatusCode::SERVICE_UNAVAILABLE, "S3 not configured".to_string()))?;
    let url = s3.presign_get(&req.key, req.ttl_secs.unwrap_or(60)).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(PresignResponse { url, key: req.key }))
}

#[derive(serde::Deserialize)]
struct FinalizeRequest {
    site_id: String,
    session_id: String,
    visitor_id: String,
    started_at: i64,
    ended_at: i64,
    country_code: Option<String>,
    device_type: Option<String>,
    ua_family: Option<String>,
    pages: Option<u16>,
    errors: Option<u16>,
    size_bytes: u64,
    segment_count: u16,
    sample_rate: Option<u8>,
    has_network_logs: Option<bool>,
}

async fn finalize_session_replay(
    State((db, _, _, _, _)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    Json(req): Json<FinalizeRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let started = chrono::DateTime::from_timestamp(req.started_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid started_at".to_string()))?;
    let ended = chrono::DateTime::from_timestamp(req.ended_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid ended_at".to_string()))?;
    let duration = (req.ended_at - req.started_at).max(0) as u32;
    let date = started.date_naive();
    let s3_prefix = format!("site/{}/sess/{}/", req.site_id, req.session_id);

    let row = crate::db::SessionReplayRow {
        site_id: req.site_id,
        session_id: req.session_id,
        visitor_id: req.visitor_id,
        started_at: started,
        ended_at: ended,
        duration,
        date,
        country_code: req.country_code,
        device_type: req.device_type.unwrap_or_else(|| "unknown".to_string()),
        ua_family: req.ua_family.unwrap_or_else(|| "unknown".to_string()),
        pages: req.pages.unwrap_or(0),
        errors: req.errors.unwrap_or(0),
        size_bytes: req.size_bytes,
        segment_count: req.segment_count,
        s3_prefix,
        sample_rate: req.sample_rate.unwrap_or(100),
        has_network_logs: if req.has_network_logs.unwrap_or(false) { 1 } else { 0 },
    };

    db.upsert_session_replay(row).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(StatusCode::OK)
}
