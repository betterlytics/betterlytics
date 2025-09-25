use std::net::SocketAddr;
use std::time::Duration;
use std::sync::Arc;

use axum::{extract::{ConnectInfo, State}, http::{HeaderMap, StatusCode}, Json};
use moka::sync::Cache;
use once_cell::sync::Lazy;

use crate::analytics;
use crate::session;
use crate::storage::s3::S3Service;
use crate::ua_parser;
use crate::db::{SharedDatabase, SessionReplayRow};
use crate::processing::EventProcessor;
use crate::metrics::MetricsCollector;
use crate::validation::EventValidator;

#[derive(Clone)]
pub struct FinalizeMeta {
    pub last_ended_at: i64,
}

static FINALIZE_CACHE: Lazy<Cache<String, FinalizeMeta>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(2 * 60 * 60))
        .build()
});

fn cache_key(site_id: &str, session_id: &str) -> String {
    format!("{}:{}", site_id, session_id)
}

#[derive(serde::Deserialize)]
pub struct PresignPutRequest {
    pub site_id: String,
    pub screen_resolution: Option<String>,
    pub content_type: Option<String>,
    pub content_encoding: Option<String>,
    pub ttl_secs: Option<u64>,
}

#[derive(serde::Serialize)]
pub struct PresignPutResponse {
    pub url: String,
    pub key: String,
    pub session_id: String,
    pub visitor_id: String,
}

pub async fn presign_put_segment(
    State((_, _, _, _, s3)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(req): Json<PresignPutRequest>,
) -> Result<Json<PresignPutResponse>, (StatusCode, String)> {
    let s3 = s3.ok_or((StatusCode::SERVICE_UNAVAILABLE, "S3 not configured".to_string()))?;
    let ip_address = crate::parse_ip(headers.clone()).unwrap_or(addr.ip()).to_string();
    let user_agent = headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let parsed = ua_parser::parse_user_agent(user_agent);
    let device_type_from_res = req.screen_resolution.as_deref().and_then(|sr| sr.split_once('x')).and_then(|(w, _)| w.trim().parse::<u32>().ok()).map(|width| {
        if width <= 575 { "mobile".to_string() }
        else if width <= 991 { "tablet".to_string() }
        else if width <= 1439 { "laptop".to_string() }
        else { "desktop".to_string() }
    });
    let fingerprint = analytics::generate_fingerprint(
        &ip_address,
        device_type_from_res.as_deref(),
        Some(parsed.browser.as_str()),
        parsed.browser_version.as_deref(),
        Some(parsed.os.as_str()),
    );
    let session_id = session::get_or_create_session_id(&req.site_id, &fingerprint)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let key = s3.build_replay_object_key(&req.site_id, &session_id);
    let url = s3.presign_replay_put(
        &key,
        req.content_type.as_deref().unwrap_or("application/json"),
        req.content_encoding.as_deref(),
        req.ttl_secs.unwrap_or(60),
    ).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PresignPutResponse { url, key, session_id, visitor_id: fingerprint }))
}

#[derive(serde::Deserialize)]
pub struct FinalizeRequest {
    pub site_id: String,
    pub session_id: String,
    pub visitor_id: String,
    pub started_at: i64,
    pub ended_at: i64,
    pub size_bytes: u64,
    pub sample_rate: Option<u8>,
    pub start_url: Option<String>,
}

pub async fn finalize_session_replay(
    State((db, _, _, _, _)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    Json(req): Json<FinalizeRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let key = cache_key(&req.site_id, &req.session_id);
    if let Some(meta) = FINALIZE_CACHE.get(&key) {
        if req.ended_at <= meta.last_ended_at {
            return Ok(StatusCode::OK);
        }
    }

    let started = chrono::DateTime::from_timestamp(req.started_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid started_at".to_string()))?;
    let ended = chrono::DateTime::from_timestamp(req.ended_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid ended_at".to_string()))?;
    let duration = (req.ended_at - req.started_at).max(0) as u32;
    let date = started.date_naive();
    let s3_prefix = format!("site/{}/sess/{}/", req.site_id, req.session_id);

    let row = SessionReplayRow {
        site_id: req.site_id,
        session_id: req.session_id,
        visitor_id: req.visitor_id,
        started_at: started,
        ended_at: ended,
        duration,
        date,
        size_bytes: req.size_bytes,
        s3_prefix,
        sample_rate: req.sample_rate.unwrap_or(100),
        start_url: req.start_url.unwrap_or_else(|| "".to_string()),
    };

    db.upsert_session_replay(row).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    FINALIZE_CACHE.insert(key, FinalizeMeta { last_ended_at: req.ended_at });
    Ok(StatusCode::OK)
}
