pub mod store;

use std::time::Duration;
use std::sync::Arc;

use axum::{extract::{Query, State}, http::StatusCode};
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

static META_CACHE: Lazy<Cache<String, SessionReplayMetaRow>> = Lazy::new(|| {
    Cache::builder()
        .max_capacity(500_000)
        .time_to_live(Duration::from_secs(2 * 60 * 60))
        .build()
});

// Serializes each session's read-check-store-update sequence so concurrent requests
// can't lose accumulated meta or slip past MAX_SESSION_BYTES on a stale read.
static META_LOCKS: Lazy<Cache<String, Arc<tokio::sync::Mutex<()>>>> = Lazy::new(|| {
    Cache::builder()
        .max_capacity(1_000_000)
        .time_to_idle(Duration::from_secs(2 * 60 * 60))
        .build()
});

fn cache_key(site_id: &str, session_id: u64) -> String {
    format!("{}:{}", site_id, session_id)
}

pub const MAX_CONTENT_LENGTH_BYTES: u64 = 5 * 1024 * 1024;
const MAX_SESSION_BYTES: u64 = 50 * 1024 * 1024;
const MAX_SEGMENT_SPAN_MS: i64 = 24 * 60 * 60 * 1000;
const STARTED_AT_TOLERANCE_SECS: i64 = 5;
const MAX_CLOCK_SKEW_MS: i64 = 5 * 60 * 1000;
const MAX_FILENAME_EPOCH_MS: i64 = 9_999_999_999_999;
const MAX_START_URL_CHARS: usize = 2048;
const MAX_CHUNK_ID_CHARS: usize = 32;

// Client bounds are used when within MAX_CLOCK_SKEW_MS of the server clock, otherwise
// only the span is kept and re-anchored to server time.
fn segment_span_ms(started_at_ms: Option<i64>, ended_at_ms: Option<i64>) -> Option<i64> {
    let span = match (started_at_ms, ended_at_ms) {
        (Some(started), Some(ended)) => ended.saturating_sub(started).max(0),
        _ => 0,
    };
    (span <= MAX_SEGMENT_SPAN_MS).then_some(span)
}

fn segment_end_ms(now_ms: i64, client_ended_at_ms: Option<i64>) -> i64 {
    match client_ended_at_ms {
        Some(t) if now_ms.abs_diff(t) <= MAX_CLOCK_SKEW_MS as u64 => t,
        _ => now_ms,
    }
}

fn segment_filename_epoch_ms(now_ms: i64, client_ended_at_ms: Option<i64>) -> i64 {
    match client_ended_at_ms {
        Some(t) => t.clamp(0, MAX_FILENAME_EPOCH_MS),
        None => now_ms,
    }
}

fn clamp_started_at(started: DateTime<Utc>, session_created_at: DateTime<Utc>) -> DateTime<Utc> {
    started.max(session_created_at - chrono::Duration::seconds(STARTED_AT_TOLERANCE_SECS))
}

pub struct ReplayCtx {
    pub mode: ReplayStorage,
    pub store: SegmentStore,
}

fn valid_chunk_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= MAX_CHUNK_ID_CHARS
        && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

pub fn build_segment_filename(epoch_ms: i64, chunk_id: Option<&str>) -> String {
    match chunk_id {
        Some(id) => format!("{:013}-{}.json", epoch_ms, id),
        None => format!("{:013}-{}.json", epoch_ms, nanoid::nanoid!(6)),
    }
}

#[derive(serde::Deserialize)]
pub struct UploadSegmentParams {
    pub site_id: String,
    pub url: Option<String>,
    pub screen_resolution: Option<String>,
    pub started_at_ms: Option<i64>,
    pub ended_at_ms: Option<i64>,
    pub event_count: Option<u32>,
    pub encoding: Option<String>,
    pub chunk_id: Option<String>,
}

pub async fn upload_segment(
    State((db, processor, _, _, replay_ctx, site_cfg_cache)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<ReplayCtx>>, Arc<SiteConfigCache>)>,
    client: ClientRequest,
    Query(p): Query<UploadSegmentParams>,
    body: Bytes,
) -> Result<StatusCode, (StatusCode, String)> {
    let replay_ctx = replay_ctx.ok_or((StatusCode::SERVICE_UNAVAILABLE, "session replay not configured".to_string()))?;

    let url = p.url.as_deref().unwrap_or_default();
    if url.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "missing url".to_string()));
    }

    if processor.check_replay_request(
        &p.site_id,
        &client.ip,
        &client.user_agent,
        &client.sec_ch_ua,
        url,
        p.screen_resolution.as_deref().unwrap_or_default(),
        client.prefetch,
    ) {
        return Err((StatusCode::FORBIDDEN, "rejected".to_string()));
    }

    validate_site_policies(&site_cfg_cache, &p.site_id, url, &client.ip)
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
    if p.chunk_id.as_deref().is_some_and(|id| !valid_chunk_id(id)) {
        return Err((StatusCode::BAD_REQUEST, "invalid chunk_id".to_string()));
    }

    let gzip = p.encoding.as_deref() == Some("gzip");
    let body_len = body.len() as u64;
    let payload = replay_ctx.store.prepare(body, gzip).await.map_err(store_error)?;
    let now_ms = Utc::now().timestamp_millis();
    let span_ms = segment_span_ms(p.started_at_ms, p.ended_at_ms).ok_or_else(|| {
        warn!(site_id = %p.site_id, "rejected replay segment with invalid time span");
        (StatusCode::BAD_REQUEST, "invalid timestamp".to_string())
    })?;

    let internal = || (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string());
    let ended_ms = segment_end_ms(now_ms, p.ended_at_ms);
    let ended = DateTime::from_timestamp_millis(ended_ms).ok_or_else(internal)?;
    let started = DateTime::from_timestamp_millis(ended_ms - span_ms).ok_or_else(internal)?;
    let started = clamp_started_at(started, identity.session_created_at);
    let ended = ended.max(started);
    let filename = build_segment_filename(segment_filename_epoch_ms(now_ms, p.ended_at_ms), p.chunk_id.as_deref());

    let start_url: String = p
        .url
        .as_deref()
        .map(|u| extract_domain_and_path_from_url(u).1)
        .unwrap_or_default()
        .chars()
        .take(MAX_START_URL_CHARS)
        .collect();
    let key = cache_key(&p.site_id, identity.session_id);
    let session_lock = META_LOCKS.get_with(key.clone(), || Arc::new(tokio::sync::Mutex::new(())));
    let _guard = session_lock.lock().await;
    if p.chunk_id.is_some()
        && replay_ctx.store.exists(&p.site_id, identity.session_id, &filename).await.map_err(store_error)?
    {
        return Ok(StatusCode::NO_CONTENT);
    }
    let loaded_meta = get_or_load_meta(&db, &key, &p.site_id, identity.session_id).await;
    if let Err(e) = &loaded_meta {
        error!(site_id = %p.site_id, session_id = identity.session_id, "Failed to load replay meta, storing segment and meta will catch up on the next segment: {}", e);
    }
    if let Ok(Some(meta)) = &loaded_meta {
        if meta.size_bytes.saturating_add(body_len) > MAX_SESSION_BYTES {
            return Err((StatusCode::TOO_MANY_REQUESTS, "session replay size limit exceeded".to_string()));
        }
    }

    replay_ctx.store.store(&p.site_id, identity.session_id, &filename, payload).await.map_err(store_error)?;

    let Ok(loaded) = loaded_meta else {
        return Ok(StatusCode::NO_CONTENT);
    };
    let mut meta = loaded.unwrap_or_else(|| SessionReplayMetaRow {
        started_at: started,
        ended_at: ended,
        size_bytes: 0,
        start_url: start_url.clone(),
        event_count: 0,
        visitor_id: identity.fingerprint,
    });
    meta.started_at = meta.started_at.min(started);
    meta.ended_at = meta.ended_at.max(ended);
    meta.size_bytes = meta.size_bytes.saturating_add(body_len);
    meta.event_count = meta.event_count.saturating_add(p.event_count.unwrap_or_default());
    if meta.start_url.is_empty() {
        meta.start_url = start_url;
    }

    META_CACHE.insert(key, meta.clone());
    if let Err(e) = upsert_replay_row(&db, &replay_ctx, &p.site_id, identity.session_id, &meta).await {
        error!(site_id = %p.site_id, session_id = identity.session_id, "Failed to upsert session replay, segment stored and meta will catch up on the next segment: {}", e);
    }

    Ok(StatusCode::NO_CONTENT)
}

fn store_error(e: StoreError) -> (StatusCode, String) {
    match e {
        StoreError::InvalidPayload(_) => (StatusCode::BAD_REQUEST, e.to_string()),
        StoreError::Storage(_) => {
            error!("Failed to store replay segment: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string())
        }
    }
}

async fn get_or_load_meta(
    db: &SharedDatabase,
    key: &str,
    site_id: &str,
    session_id: u64,
) -> anyhow::Result<Option<SessionReplayMetaRow>> {
    if let Some(meta) = META_CACHE.get(key) {
        return Ok(Some(meta));
    }
    db.fetch_session_replay_meta(site_id, session_id).await
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
        storage: replay_ctx.mode.as_str().to_string(),
    };
    db.upsert_session_replay(row).await
}

#[cfg(test)]
mod tests {
    use super::*;

    const T: i64 = 1_755_600_000_000;
    const THREE_DAYS_MS: i64 = 3 * 24 * 60 * 60 * 1000;

    #[test]
    fn span_ignores_the_client_clock_offset() {
        assert_eq!(segment_span_ms(Some(T), Some(T + 60_000)), Some(60_000));
        assert_eq!(segment_span_ms(Some(T + THREE_DAYS_MS), Some(T + THREE_DAYS_MS + 60_000)), Some(60_000));
        assert_eq!(segment_span_ms(Some(T - THREE_DAYS_MS), Some(T - THREE_DAYS_MS + 60_000)), Some(60_000));
    }

    #[test]
    fn missing_bounds_mean_a_zero_span() {
        assert_eq!(segment_span_ms(None, None), Some(0));
        assert_eq!(segment_span_ms(Some(T), None), Some(0));
        assert_eq!(segment_span_ms(None, Some(T)), Some(0));
        assert_eq!(segment_span_ms(Some(T), Some(T)), Some(0));
    }

    #[test]
    fn clamps_negative_and_rejects_oversized_spans() {
        assert_eq!(segment_span_ms(Some(T + 1), Some(T)), Some(0));
        assert_eq!(segment_span_ms(Some(T), Some(T + MAX_SEGMENT_SPAN_MS)), Some(MAX_SEGMENT_SPAN_MS));
        assert_eq!(segment_span_ms(Some(T), Some(T + MAX_SEGMENT_SPAN_MS + 1)), None);
        assert_eq!(segment_span_ms(Some(i64::MIN), Some(i64::MAX)), None);
        assert_eq!(segment_span_ms(Some(i64::MAX), Some(i64::MIN)), Some(0));
    }

    #[test]
    fn client_end_is_used_within_skew_window() {
        assert_eq!(segment_end_ms(T, Some(T - 14_000)), T - 14_000);
        assert_eq!(segment_end_ms(T, Some(T - MAX_CLOCK_SKEW_MS)), T - MAX_CLOCK_SKEW_MS);
        assert_eq!(segment_end_ms(T, Some(T + MAX_CLOCK_SKEW_MS)), T + MAX_CLOCK_SKEW_MS);
        assert_eq!(segment_end_ms(T, Some(T - MAX_CLOCK_SKEW_MS - 1)), T);
        assert_eq!(segment_end_ms(T, Some(T + MAX_CLOCK_SKEW_MS + 1)), T);
        assert_eq!(segment_end_ms(T, None), T);
        assert_eq!(segment_end_ms(T, Some(i64::MIN)), T);
        assert_eq!(segment_end_ms(T, Some(i64::MAX)), T);
    }

    #[test]
    fn filename_epoch_trusts_client_clock() {
        assert_eq!(segment_filename_epoch_ms(T, Some(T - 10 * 60 * 1000)), T - 10 * 60 * 1000);
        assert_eq!(segment_filename_epoch_ms(T + 6 * 60 * 1000, Some(T)), T);
        assert_eq!(segment_filename_epoch_ms(T, Some(T - THREE_DAYS_MS - 1)), T - THREE_DAYS_MS - 1);
        assert_eq!(segment_filename_epoch_ms(T, Some(T + THREE_DAYS_MS + 1)), T + THREE_DAYS_MS + 1);
        assert_eq!(segment_filename_epoch_ms(T, None), T);
        assert_eq!(segment_filename_epoch_ms(T, Some(i64::MIN)), 0);
        assert_eq!(segment_filename_epoch_ms(T, Some(i64::MAX)), MAX_FILENAME_EPOCH_MS);
    }

    #[test]
    fn chunk_id_validation() {
        assert!(valid_chunk_id("abc123-7"));
        assert!(valid_chunk_id("a_b"));
        assert!(!valid_chunk_id(""));
        assert!(!valid_chunk_id(&"a".repeat(MAX_CHUNK_ID_CHARS + 1)));
        assert!(!valid_chunk_id("a/b"));
        assert!(!valid_chunk_id("a.b"));
    }

    #[test]
    fn filename_uses_chunk_id_when_present() {
        assert_eq!(build_segment_filename(T, Some("abc123-7")), format!("{:013}-abc123-7.json", T));
        assert!(build_segment_filename(T, None).starts_with(&format!("{:013}-", T)));
    }

    #[test]
    fn started_at_before_session_creation_is_clamped() {
        let created = DateTime::from_timestamp_millis(T).unwrap();
        let started = created - chrono::Duration::minutes(10);
        assert_eq!(clamp_started_at(started, created), created - chrono::Duration::seconds(5));
    }

    #[test]
    fn started_at_within_tolerance_is_kept() {
        let created = DateTime::from_timestamp_millis(T).unwrap();
        let started = created - chrono::Duration::seconds(3);
        assert_eq!(clamp_started_at(started, created), started);
        assert_eq!(clamp_started_at(created, created), created);
    }
}
