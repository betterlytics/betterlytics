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
use chrono::{DateTime, Utc};

use crate::db::{SharedDatabase, SessionReplayRow};
use crate::processing::EventProcessor;
use crate::metrics::MetricsCollector;
use crate::validation::EventValidator;
use crate::url_utils::extract_domain_and_path_from_url;

#[derive(Clone)]
pub struct FinalizeMeta {
    pub started_at: DateTime<Utc>,
    pub ended_at: DateTime<Utc>,
    pub size_bytes: u64,
    pub sample_rate: u8,
    pub start_url: String,
    pub event_count: u32,
}

static FINALIZE_CACHE: Lazy<Cache<String, FinalizeMeta>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(2 * 60 * 60))
        .build()
});

fn cache_key(site_id: &str, session_id: &str) -> String {
    format!("{}:{}", site_id, session_id)
}

const PRESIGNED_PUT_TTL_SECS: u64 = 30;
const CONTENT_TYPE: &str = "application/json";

#[derive(serde::Deserialize)]
pub struct PresignPutRequest {
    pub site_id: String,
    pub screen_resolution: Option<String>,
    pub content_encoding: Option<String>,
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
        CONTENT_TYPE,
        match req.content_encoding.as_deref() {
            Some("gzip") => Some("gzip"),
            _ => None,
        },
        PRESIGNED_PUT_TTL_SECS,
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
    pub event_count: Option<u32>,
}

pub async fn finalize_session_replay(
    State((db, _, _, _, _)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<S3Service>>)>,
    Json(req): Json<FinalizeRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let key = cache_key(&req.site_id, &req.session_id);
    let started = chrono::DateTime::from_timestamp(req.started_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid started_at".to_string()))?;
    let ended = chrono::DateTime::from_timestamp(req.ended_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid ended_at".to_string()))?;
    let normalized_start_url = req
        .start_url
        .as_deref()
        .map(|url| {
            let (_, path) = extract_domain_and_path_from_url(url);
            path
        })
        .unwrap_or_default();

    let mut meta = if let Some(existing) = FINALIZE_CACHE.get(&key) {
        if req.ended_at <= existing.ended_at.timestamp() && req.size_bytes <= existing.size_bytes {
            return Ok(StatusCode::OK);
        }
        existing
    } else {
        FinalizeMeta {
            started_at: started,
            ended_at: ended,
            size_bytes: req.size_bytes,
            sample_rate: req.sample_rate.unwrap_or(100),
            start_url: normalized_start_url.clone(),
            event_count: 0,
        }
    };

    meta.started_at = meta.started_at.min(started);
    meta.ended_at = meta.ended_at.max(ended);
    meta.size_bytes = meta.size_bytes.saturating_add(req.size_bytes);
    meta.sample_rate = req.sample_rate.unwrap_or(meta.sample_rate);
    meta.event_count = meta.event_count.saturating_add(req.event_count.unwrap_or_default());
    if meta.start_url.is_empty() {
        meta.start_url = normalized_start_url.clone();
    }

    let duration = (meta.ended_at.timestamp() - meta.started_at.timestamp()).max(0) as u32;
    let date = meta.started_at.date_naive();
    let s3_prefix = format!("site/{}/sess/{}/", req.site_id, req.session_id);

    let row = SessionReplayRow {
        site_id: req.site_id,
        session_id: req.session_id,
        visitor_id: req.visitor_id,
        started_at: meta.started_at,
        ended_at: meta.ended_at,
        duration,
        date,
        size_bytes: meta.size_bytes,
        event_count: meta.event_count,
        s3_prefix,
        sample_rate: meta.sample_rate,
        start_url: meta.start_url.clone(),
    };

    db.upsert_session_replay(row).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    FINALIZE_CACHE.insert(key, meta);
    Ok(StatusCode::OK)
}
