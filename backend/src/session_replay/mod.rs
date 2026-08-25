pub mod store;

use std::time::Duration;
use std::sync::Arc;

use axum::{extract::{Query, State}, http::{HeaderMap, StatusCode, header::CONTENT_ENCODING}, Json};
use bytes::Bytes;
use tracing::{error, warn};
use moka::sync::Cache;
use once_cell::sync::Lazy;

use crate::client_request::ClientRequest;
use crate::config::ReplayStorage;
use crate::site_config::SiteConfigCache;
use store::{SegmentStore, StoreError};
use crate::ua_parser;
use crate::visitor;
use crate::analytics::{VisitorAttrs, detect_device_type_from_resolution};
use chrono::{DateTime, Utc};

use crate::db::{SessionReplayMetaRow, SharedDatabase, SessionReplayRow};
use crate::processing::EventProcessor;
use crate::metrics::MetricsCollector;
use crate::validation::{validate_site_policies, EventValidator};
use crate::url_utils::{extract_domain_and_path_from_url, extract_root_domain};
use crate::error_fingerprint::generate_error_fingerprint;

static FINALIZE_CACHE: Lazy<Cache<String, SessionReplayMetaRow>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(2 * 60 * 60))
        .build()
});

// Serializes each session's read-check-store-update sequence so concurrent requests
// can't lose accumulated meta or slip past MAX_SESSION_BYTES on a stale read.
static META_LOCKS: Lazy<Cache<String, Arc<tokio::sync::Mutex<()>>>> = Lazy::new(|| {
    Cache::builder()
        .time_to_idle(Duration::from_secs(2 * 60 * 60))
        .build()
});

fn cache_key(site_id: &str, session_id: u64) -> String {
    format!("{}:{}", site_id, session_id)
}

pub const MAX_CONTENT_LENGTH_BYTES: u64 = 5 * 1024 * 1024;
const MAX_SESSION_BYTES: u64 = 50 * 1024 * 1024;
const MAX_ERROR_FINGERPRINTS: usize = 16;
const TIMESTAMP_WINDOW_MS: i64 = 24 * 60 * 60 * 1000;

fn timestamp_in_window(epoch_ms: i64, now_ms: i64) -> bool {
    epoch_ms.saturating_sub(now_ms).saturating_abs() <= TIMESTAMP_WINDOW_MS
}

pub struct ReplayCtx {
    pub mode: ReplayStorage,
    pub store: SegmentStore,
}

pub fn build_segment_filename(epoch_ms: i64) -> String {
    format!("{:013}-{}.json", epoch_ms, nanoid::nanoid!(6))
}

#[derive(serde::Deserialize)]
pub struct UploadSegmentParams {
    pub site_id: String,
    pub url: Option<String>,
    pub screen_resolution: Option<String>,
    pub started_at_ms: Option<i64>,
    pub ended_at_ms: Option<i64>,
    pub event_count: Option<u32>,
}

#[derive(serde::Serialize)]
pub struct UploadSegmentResponse {
    #[serde(with = "u64_as_string")]
    pub session_id: u64,
    #[serde(with = "u64_as_string")]
    pub visitor_id: u64,
}

mod u64_as_string {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {
        s.collect_str(v)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        String::deserialize(d)?.parse().map_err(serde::de::Error::custom)
    }
}

pub async fn upload_segment(
    State((db, processor, _, _, replay_ctx, site_cfg_cache)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<ReplayCtx>>, Arc<SiteConfigCache>)>,
    client: ClientRequest,
    Query(p): Query<UploadSegmentParams>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<UploadSegmentResponse>, (StatusCode, String)> {
    let replay_ctx = replay_ctx.ok_or((StatusCode::SERVICE_UNAVAILABLE, "session replay not configured".to_string()))?;

    if processor.check_replay_request(
        &p.site_id,
        &client.ip,
        &client.user_agent,
        &client.sec_ch_ua,
        p.url.as_deref().unwrap_or_default(),
        p.screen_resolution.as_deref().unwrap_or_default(),
        client.prefetch,
    ) {
        return Err((StatusCode::FORBIDDEN, "rejected".to_string()));
    }

    validate_site_policies(&site_cfg_cache, &p.site_id, p.url.as_deref().unwrap_or_default(), &client.ip)
        .await
        .map_err(|e| (StatusCode::FORBIDDEN, e.to_string()))?;

    let parsed = ua_parser::parse_user_agent(&client.user_agent);

    let device_type_from_res = p.screen_resolution.as_deref()
        .and_then(|sr| detect_device_type_from_resolution(sr));

    let root_domain = p.url.as_ref()
        .and_then(|url| extract_domain_and_path_from_url(url).0)
        .and_then(|domain| extract_root_domain(&domain));

    let identity = {
        let attrs = VisitorAttrs {
            ip: &client.ip,
            device_type: device_type_from_res.as_deref(),
            browser: Some(parsed.browser.as_str()),
            browser_version: parsed.browser_version.as_deref(),
            os: Some(parsed.os.as_str()),
            root_domain: root_domain.as_deref(),
        };
        visitor::identify(&p.site_id, &attrs, Utc::now())
    };

    if body.is_empty() || body.len() as u64 > MAX_CONTENT_LENGTH_BYTES {
        return Err((StatusCode::BAD_REQUEST, "invalid content length".to_string()));
    }

    let gzip = headers
        .get(CONTENT_ENCODING)
        .and_then(|v| v.to_str().ok())
        == Some("gzip");
    let now_ms = Utc::now().timestamp_millis();
    let epoch_ms = p.ended_at_ms.unwrap_or(now_ms);
    if !timestamp_in_window(epoch_ms, now_ms)
        || !p.started_at_ms.map_or(true, |s| timestamp_in_window(s, now_ms))
    {
        warn!(site_id = %p.site_id, "rejected replay segment with out-of-window timestamp");
        return Err((StatusCode::BAD_REQUEST, "invalid timestamp".to_string()));
    }
    let filename = build_segment_filename(epoch_ms);

    let started = DateTime::from_timestamp_millis(p.started_at_ms.unwrap_or(epoch_ms))
        .ok_or((StatusCode::BAD_REQUEST, "invalid started_at_ms".to_string()))?;
    let ended = DateTime::from_timestamp_millis(epoch_ms)
        .ok_or((StatusCode::BAD_REQUEST, "invalid ended_at_ms".to_string()))?;
    let body_len = body.len() as u64;

    let start_url = p.url.as_deref().map(|u| extract_domain_and_path_from_url(u).1).unwrap_or_default();
    let key = cache_key(&p.site_id, identity.session_id);
    let session_lock = META_LOCKS.get_with(key.clone(), || Arc::new(tokio::sync::Mutex::new(())));
    let _guard = session_lock.lock().await;
    let mut meta = get_or_load_meta(&db, &key, &p.site_id, identity.session_id).await?
        .unwrap_or_else(|| SessionReplayMetaRow {
            started_at: started,
            ended_at: ended,
            size_bytes: 0,
            start_url: start_url.clone(),
            event_count: 0,
            error_fingerprints: Vec::new(),
            visitor_id: identity.fingerprint,
        });

    if meta.size_bytes.saturating_add(body_len) > MAX_SESSION_BYTES {
        return Err((StatusCode::TOO_MANY_REQUESTS, "session replay size limit exceeded".to_string()));
    }

    let budget = MAX_SESSION_BYTES.saturating_sub(meta.size_bytes);
    let stored_bytes = replay_ctx.store.store(&p.site_id, identity.session_id, &filename, body, gzip, budget).await.map_err(|e| match e {
        StoreError::InvalidPayload(_) => (StatusCode::BAD_REQUEST, e.to_string()),
        StoreError::BudgetExceeded => (StatusCode::TOO_MANY_REQUESTS, "session replay size limit exceeded".to_string()),
        StoreError::Storage(_) => {
            error!("Failed to store replay segment: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string())
        }
    })?;
    meta.started_at = meta.started_at.min(started);
    meta.ended_at = meta.ended_at.max(ended);
    meta.size_bytes = meta.size_bytes.saturating_add(stored_bytes);
    meta.event_count = meta.event_count.saturating_add(p.event_count.unwrap_or_default());
    if meta.start_url.is_empty() {
        meta.start_url = start_url;
    }

    upsert_replay_row(&db, &replay_ctx, &p.site_id, identity.session_id, &meta).await.map_err(|e| {
        error!("Failed to upsert session replay: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string())
    })?;
    FINALIZE_CACHE.insert(key, meta);

    Ok(Json(UploadSegmentResponse {
        session_id: identity.session_id,
        visitor_id: identity.fingerprint,
    }))
}

async fn get_or_load_meta(
    db: &SharedDatabase,
    key: &str,
    site_id: &str,
    session_id: u64,
) -> Result<Option<SessionReplayMetaRow>, (StatusCode, String)> {
    if let Some(meta) = FINALIZE_CACHE.get(key) {
        return Ok(Some(meta));
    }
    db.fetch_session_replay_meta(site_id, session_id).await.map_err(|e| {
        error!("Failed to load stored replay meta: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string())
    })
}

async fn upsert_replay_row(
    db: &SharedDatabase,
    replay_ctx: &ReplayCtx,
    site_id: &str,
    session_id: u64,
    meta: &SessionReplayMetaRow,
) -> anyhow::Result<()> {
    let duration = (meta.ended_at.timestamp() - meta.started_at.timestamp()).max(0) as u32;
    let row = SessionReplayRow {
        site_id: site_id.to_string(),
        session_id,
        visitor_id: meta.visitor_id,
        started_at: meta.started_at,
        ended_at: meta.ended_at,
        duration,
        date: meta.started_at.date_naive(),
        size_bytes: meta.size_bytes,
        event_count: meta.event_count,
        s3_prefix: format!("site/{}/sess/{}/", site_id, session_id),
        start_url: meta.start_url.clone(),
        error_fingerprints: meta.error_fingerprints.clone(),
        storage: replay_ctx.mode.as_str().to_string(),
    };
    db.upsert_session_replay(row).await
}

#[derive(serde::Deserialize)]
pub struct ReplayErrorRequest {
    pub site_id: String,
    #[serde(with = "u64_as_string")]
    pub session_id: u64,
    // cache-miss fallback only (e.g. backend restarted since the last segment upload)
    pub started_at: i64,
    pub ended_at: i64,
    pub url: Option<String>,
    pub error_type: String,
    pub error_exceptions: String,
}

pub async fn attach_replay_error(
    State((db, processor, _, _, replay_ctx, site_cfg_cache)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<ReplayCtx>>, Arc<SiteConfigCache>)>,
    client: ClientRequest,
    Json(req): Json<ReplayErrorRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let replay_ctx = replay_ctx.ok_or((StatusCode::SERVICE_UNAVAILABLE, "session replay not configured".to_string()))?;
    if processor.check_replay_request(
        &req.site_id,
        &client.ip,
        &client.user_agent,
        &client.sec_ch_ua,
        req.url.as_deref().unwrap_or_default(),
        "",
        client.prefetch,
    ) {
        return Err((StatusCode::FORBIDDEN, "rejected".to_string()));
    }

    validate_site_policies(&site_cfg_cache, &req.site_id, req.url.as_deref().unwrap_or_default(), &client.ip)
        .await
        .map_err(|e| (StatusCode::FORBIDDEN, e.to_string()))?;

    let now_ms = Utc::now().timestamp_millis();
    if !timestamp_in_window(req.started_at.saturating_mul(1000), now_ms)
        || !timestamp_in_window(req.ended_at.saturating_mul(1000), now_ms)
    {
        warn!(site_id = %req.site_id, "rejected replay error with out-of-window timestamp");
        return Err((StatusCode::BAD_REQUEST, "invalid timestamp".to_string()));
    }

    let key = cache_key(&req.site_id, req.session_id);
    let started = DateTime::from_timestamp(req.started_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid started_at".to_string()))?;
    let ended = DateTime::from_timestamp(req.ended_at, 0).ok_or((StatusCode::BAD_REQUEST, "invalid ended_at".to_string()))?;

    let session_lock = META_LOCKS.get_with(key.clone(), || Arc::new(tokio::sync::Mutex::new(())));
    let _guard = session_lock.lock().await;
    let mut meta = get_or_load_meta(&db, &key, &req.site_id, req.session_id).await?
        .ok_or((StatusCode::NOT_FOUND, "unknown session".to_string()))?;

    let fp = generate_error_fingerprint(&req.error_type, &req.error_exceptions);
    if !fp.is_empty()
        && !meta.error_fingerprints.contains(&fp)
        && meta.error_fingerprints.len() < MAX_ERROR_FINGERPRINTS
    {
        meta.error_fingerprints.push(fp);
    }
    meta.started_at = meta.started_at.min(started);
    meta.ended_at = meta.ended_at.max(ended);

    upsert_replay_row(&db, &replay_ctx, &req.site_id, req.session_id, &meta).await.map_err(|e| {
        error!("Failed to upsert session replay: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string())
    })?;
    FINALIZE_CACHE.insert(key, meta);
    Ok(StatusCode::OK)
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOW_MS: i64 = 1_755_600_000_000;

    #[test]
    fn accepts_timestamps_within_window() {
        assert!(timestamp_in_window(NOW_MS, NOW_MS));
        assert!(timestamp_in_window(NOW_MS - TIMESTAMP_WINDOW_MS, NOW_MS));
        assert!(timestamp_in_window(NOW_MS + TIMESTAMP_WINDOW_MS, NOW_MS));
    }

    #[test]
    fn rejects_timestamps_outside_window() {
        assert!(!timestamp_in_window(NOW_MS - TIMESTAMP_WINDOW_MS - 1, NOW_MS));
        assert!(!timestamp_in_window(NOW_MS + TIMESTAMP_WINDOW_MS + 1, NOW_MS));
        assert!(!timestamp_in_window(0, NOW_MS));
        assert!(!timestamp_in_window(i64::MIN, NOW_MS));
        assert!(!timestamp_in_window(i64::MAX, NOW_MS));
    }
}
