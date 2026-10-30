mod envelope;
pub mod store;

use std::future::Future;
use std::time::{Duration, Instant};
use std::sync::Arc;

use axum::{extract::{Query, State, rejection::{BytesRejection, QueryRejection}}, http::StatusCode};
use bytes::Bytes;
use tracing::{error, warn};
use moka::sync::Cache;
use once_cell::sync::Lazy;

use crate::bot_detection;
use crate::client_request::ClientRequest;
use crate::config::ReplayStorage;
use crate::site_config::SiteConfigCache;
use store::{SegmentStore, StoreError};
use crate::ua_parser;
use crate::visitor;
use crate::analytics::{VisitorAttrs, detect_device_type_from_resolution};
use chrono::{DateTime, NaiveDate, Utc};

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
pub const MAX_UPLOAD_BODY_BYTES: u64 = MAX_CONTENT_LENGTH_BYTES + envelope::MAX_METADATA_BYTES as u64 + 4;
const MAX_SESSION_BYTES: u64 = 50 * 1024 * 1024;
const MAX_SEGMENT_SPAN_MS: i64 = 24 * 60 * 60 * 1000;
const MAX_FILENAME_EPOCH_MS: i64 = 9_999_999_999_999;
const MAX_START_URL_CHARS: usize = 2048;
const MAX_CHUNK_ID_CHARS: usize = 32;

// Client event timestamps for one chunk: both required, ordered, positive, and at most a day apart.
fn client_bounds_ms(started_at_ms: Option<i64>, ended_at_ms: Option<i64>) -> Option<(i64, i64)> {
    started_at_ms
        .zip(ended_at_ms)
        .filter(|&(start, end)| start > 0 && end >= start && end - start <= MAX_SEGMENT_SPAN_MS)
}

// Rows written before the client bound columns existed hold 0, so the first chunk seeds them.
fn merged_client_bounds(meta: Option<&SessionReplayMetaRow>, (start, end): (i64, i64)) -> (i64, i64) {
    match meta {
        Some(m) if m.client_ended_at_ms > 0 => (m.client_started_at_ms.min(start), m.client_ended_at_ms.max(end)),
        _ => (start, end),
    }
}

fn replay_duration_seconds(meta: &SessionReplayMetaRow) -> u32 {
    ((meta.client_ended_at_ms - meta.client_started_at_ms) / 1000).clamp(0, i64::from(u32::MAX)) as u32
}

fn estimated_started_at(received_at: DateTime<Utc>, chunk_client_end_ms: i64, session_client_start_ms: i64) -> DateTime<Utc> {
    received_at - chrono::Duration::milliseconds(chunk_client_end_ms - session_client_start_ms)
}

fn merge_chunk_errors(meta: &mut SessionReplayMetaRow, errors: envelope::ChunkErrors) {
    meta.error_fingerprints.extend(errors.fingerprints);
    meta.error_fingerprints.sort_unstable();
    meta.error_fingerprints.dedup();
    meta.recorded_error_count = meta.recorded_error_count.saturating_add(errors.count);
}

// Each rage or dead click is its own replay event, so a count above the chunk's event count is bogus.
fn chunk_click_count(count: Option<u32>, event_count: Option<u32>) -> u32 {
    match count {
        Some(n) if n <= event_count.unwrap_or(0) => n,
        _ => 0,
    }
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
    pub rage_click_count: Option<u32>,
    pub dead_click_count: Option<u32>,
    pub encoding: Option<String>,
    pub chunk_id: Option<String>,
    pub format: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum UploadOutcome {
    Stored,
    Duplicate,
    Invalid,
    Blocked,
    RateLimited,
    SessionSizeCap,
    StorageUnavailable,
    StorageError,
}

impl UploadOutcome {
    fn as_str(self) -> &'static str {
        match self {
            Self::Stored => "stored",
            Self::Duplicate => "duplicate",
            Self::Invalid => "invalid",
            Self::Blocked => "blocked",
            Self::RateLimited => "rate_limited",
            Self::SessionSizeCap => "session_size_cap",
            Self::StorageUnavailable => "storage_unavailable",
            Self::StorageError => "storage_error",
        }
    }
}

enum Uploaded {
    Stored { bytes: u64 },
    Duplicate,
}

struct Rejection {
    outcome: UploadOutcome,
    status: StatusCode,
    message: String,
}

impl Rejection {
    fn new(outcome: UploadOutcome, status: StatusCode, message: impl Into<String>) -> Self {
        Self { outcome, status, message: message.into() }
    }

    fn invalid(message: impl Into<String>) -> Self {
        Self::new(UploadOutcome::Invalid, StatusCode::BAD_REQUEST, message)
    }
}

impl From<Rejection> for (StatusCode, String) {
    fn from(r: Rejection) -> Self {
        (r.status, r.message)
    }
}

fn upload_outcome(result: &Result<Uploaded, Rejection>) -> (UploadOutcome, u64) {
    match result {
        Ok(Uploaded::Stored { bytes }) => (UploadOutcome::Stored, *bytes),
        Ok(Uploaded::Duplicate) => (UploadOutcome::Duplicate, 0),
        Err(r) => (r.outcome, 0),
    }
}

pub async fn upload_segment(
    State((db, processor, metrics, _, replay_ctx, site_cfg_cache)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<ReplayCtx>>, Arc<SiteConfigCache>)>,
    client: ClientRequest,
    query: Result<Query<UploadSegmentParams>, QueryRejection>,
    body: Result<Bytes, BytesRejection>,
) -> Result<StatusCode, (StatusCode, String)> {
    let replay_ctx = replay_ctx.ok_or((StatusCode::SERVICE_UNAVAILABLE, "session replay not configured".to_string()))?;
    let result = match (query, body) {
        (Ok(Query(p)), Ok(body)) => store_segment(&db, &processor, metrics.as_deref(), &replay_ctx, &site_cfg_cache, &client, &p, body).await,
        (Err(e), _) => Err(Rejection::new(UploadOutcome::Invalid, e.status(), e.body_text())),
        (_, Err(e)) => Err(Rejection::new(UploadOutcome::Invalid, e.status(), e.body_text())),
    };
    if let Some(m) = &metrics {
        let (outcome, stored_bytes) = upload_outcome(&result);
        m.record_replay_upload(replay_ctx.mode.as_str(), outcome.as_str(), stored_bytes);
    }
    result.map(|_| StatusCode::NO_CONTENT).map_err(Into::into)
}

async fn timed_storage_op<T>(
    metrics: Option<&MetricsCollector>,
    replay_ctx: &ReplayCtx,
    operation: &str,
    op: impl Future<Output = Result<T, StoreError>>,
) -> Result<T, StoreError> {
    let started = Instant::now();
    let result = op.await;
    if let Some(m) = metrics {
        m.record_replay_storage_operation(replay_ctx.mode.as_str(), operation, started.elapsed(), result.is_err());
    }
    result
}

#[allow(clippy::too_many_arguments)]
async fn store_segment(
    db: &SharedDatabase,
    processor: &EventProcessor,
    metrics: Option<&MetricsCollector>,
    replay_ctx: &ReplayCtx,
    site_cfg_cache: &SiteConfigCache,
    client: &ClientRequest,
    p: &UploadSegmentParams,
    body: Bytes,
) -> Result<Uploaded, Rejection> {
    let url = p.url.as_deref().unwrap_or_default();
    if url.is_empty() {
        return Err(Rejection::invalid("missing url"));
    }
    if url.len() > MAX_START_URL_CHARS {
        return Err(Rejection::invalid("url too long"));
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
        return Err(Rejection::new(UploadOutcome::Blocked, StatusCode::FORBIDDEN, "rejected"));
    }

    validate_site_policies(site_cfg_cache, &p.site_id, url, &client.ip)
        .await
        .map_err(|e| Rejection::new(UploadOutcome::Blocked, StatusCode::FORBIDDEN, e.to_string()))?;

    if bot_detection::velocity::check_replay(&p.site_id, &client.ip) {
        warn!(site_id = %p.site_id, "rejected replay segment: velocity limit exceeded");
        return Err(Rejection::new(UploadOutcome::RateLimited, StatusCode::TOO_MANY_REQUESTS, "rate limited"));
    }
    bot_detection::velocity::record_replay(&p.site_id, &client.ip);

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

    if body.is_empty() || body.len() as u64 > MAX_UPLOAD_BODY_BYTES {
        return Err(Rejection::invalid("invalid content length"));
    }
    let (replay_bytes, error_metadata) = envelope::split_body(body, p.format.as_deref()).map_err(store_error)?;
    if replay_bytes.is_empty() || replay_bytes.len() as u64 > MAX_CONTENT_LENGTH_BYTES {
        return Err(Rejection::invalid("invalid replay length"));
    }
    if p.chunk_id.as_deref().is_some_and(|id| !valid_chunk_id(id)) {
        return Err(Rejection::invalid("invalid chunk_id"));
    }

    let gzip = p.encoding.as_deref() == Some("gzip");
    let payload = replay_ctx.store.prepare(replay_bytes, gzip).await.map_err(store_error)?;
    let stored_len = payload.stored_size();
    let invalid_timestamp = || {
        warn!(site_id = %p.site_id, "rejected replay segment with invalid time span");
        Rejection::invalid("invalid timestamp")
    };
    let client_bounds = client_bounds_ms(p.started_at_ms, p.ended_at_ms).ok_or_else(invalid_timestamp)?;

    let internal = || Rejection::new(UploadOutcome::StorageError, StatusCode::INTERNAL_SERVER_ERROR, "internal error");
    let received_at = DateTime::from_timestamp_millis(Utc::now().timestamp_millis()).ok_or_else(internal)?;
    let filename_epoch_ms = client_bounds.1.min(MAX_FILENAME_EPOCH_MS);
    let filename = build_segment_filename(filename_epoch_ms, p.chunk_id.as_deref());
    let segment_date = identity.session_created_at.date_naive();

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
        && timed_storage_op(metrics, replay_ctx, "exists", replay_ctx.store.exists(&p.site_id, identity.session_id, &filename))
            .await
            .map_err(store_error)?
    {
        return Ok(Uploaded::Duplicate);
    }
    let loaded = get_or_load_meta(db, &key, &p.site_id, identity.session_id).await.map_err(|e| {
        error!(site_id = %p.site_id, session_id = identity.session_id, "Failed to load replay meta, rejecting segment for client retry: {}", e);
        Rejection::new(UploadOutcome::StorageUnavailable, StatusCode::SERVICE_UNAVAILABLE, "temporarily unavailable")
    })?;
    if let Some(meta) = &loaded {
        if meta.size_bytes.saturating_add(stored_len) > MAX_SESSION_BYTES {
            return Err(Rejection::new(UploadOutcome::SessionSizeCap, StatusCode::TOO_MANY_REQUESTS, "session replay size limit exceeded"));
        }
    }
    let (client_started_at_ms, client_ended_at_ms) = merged_client_bounds(loaded.as_ref(), client_bounds);
    if client_ended_at_ms - client_started_at_ms > MAX_SEGMENT_SPAN_MS {
        return Err(invalid_timestamp());
    }

    let chunk_errors = envelope::fingerprint_metadata(&error_metadata, p.event_count);
    timed_storage_op(
        metrics,
        replay_ctx,
        "write",
        replay_ctx.store.store(&p.site_id, identity.session_id, &filename, filename_epoch_ms, segment_date, payload),
    )
    .await
    .map_err(store_error)?;

    let started_at = estimated_started_at(received_at, client_bounds.1, client_started_at_ms);
    let mut meta = loaded.unwrap_or_else(|| SessionReplayMetaRow {
        started_at,
        ended_at: received_at,
        size_bytes: 0,
        start_url: start_url.clone(),
        event_count: 0,
        visitor_id: identity.fingerprint,
        client_started_at_ms,
        client_ended_at_ms,
        error_fingerprints: Vec::new(),
        recorded_error_count: 0,
        rage_click_count: 0,
        dead_click_count: 0,
    });
    meta.started_at = meta.started_at.min(started_at);
    meta.ended_at = meta.ended_at.max(received_at);
    meta.client_started_at_ms = client_started_at_ms;
    meta.client_ended_at_ms = client_ended_at_ms;
    meta.size_bytes = meta.size_bytes.saturating_add(stored_len);
    meta.event_count = meta.event_count.saturating_add(p.event_count.unwrap_or_default());
    merge_chunk_errors(&mut meta, chunk_errors);
    meta.rage_click_count = meta.rage_click_count.saturating_add(chunk_click_count(p.rage_click_count, p.event_count));
    meta.dead_click_count = meta.dead_click_count.saturating_add(chunk_click_count(p.dead_click_count, p.event_count));
    if meta.start_url.is_empty() {
        meta.start_url = start_url;
    }

    META_CACHE.insert(key, meta.clone());
    if let Err(e) = upsert_replay_row(db, replay_ctx, &p.site_id, identity.session_id, segment_date, &meta).await {
        if let Some(m) = metrics {
            m.increment_replay_metadata_upsert_failures();
        }
        error!(site_id = %p.site_id, session_id = identity.session_id, "Failed to upsert session replay, segment stored and meta will catch up on the next segment: {}", e);
    }

    Ok(Uploaded::Stored { bytes: stored_len })
}

fn store_error(e: StoreError) -> Rejection {
    match e {
        StoreError::InvalidPayload(_) => Rejection::invalid(e.to_string()),
        StoreError::Storage(_) => {
            error!("Failed to store replay segment: {}", e);
            Rejection::new(UploadOutcome::StorageError, StatusCode::INTERNAL_SERVER_ERROR, "internal error")
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
    date: NaiveDate,
    meta: &SessionReplayMetaRow,
) -> anyhow::Result<()> {
    let row = SessionReplayRow {
        site_id: site_id.to_string(),
        session_id,
        visitor_id: meta.visitor_id,
        started_at: meta.started_at,
        ended_at: meta.ended_at,
        duration: replay_duration_seconds(meta),
        date,
        size_bytes: meta.size_bytes,
        event_count: meta.event_count,
        s3_prefix: format!("site/{}/sess/{}/", site_id, session_id),
        start_url: meta.start_url.clone(),
        storage: replay_ctx.mode.as_str().to_string(),
        client_started_at_ms: meta.client_started_at_ms,
        client_ended_at_ms: meta.client_ended_at_ms,
        error_fingerprints: meta.error_fingerprints.clone(),
        recorded_error_count: meta.recorded_error_count,
        rage_click_count: meta.rage_click_count,
        dead_click_count: meta.dead_click_count,
    };
    db.upsert_session_replay(row).await
}

#[cfg(test)]
mod tests {
    use super::*;

    const T: i64 = 1_755_600_000_000;
    const THREE_DAYS_MS: i64 = 3 * 24 * 60 * 60 * 1000;

    #[test]
    fn bounds_accept_any_client_clock_offset() {
        assert_eq!(client_bounds_ms(Some(T), Some(T + 60_000)), Some((T, T + 60_000)));
        assert_eq!(client_bounds_ms(Some(T), Some(T)), Some((T, T)));
        assert_eq!(
            client_bounds_ms(Some(T + THREE_DAYS_MS), Some(T + THREE_DAYS_MS + 60_000)),
            Some((T + THREE_DAYS_MS, T + THREE_DAYS_MS + 60_000))
        );
        assert_eq!(client_bounds_ms(Some(T), Some(T + MAX_SEGMENT_SPAN_MS)), Some((T, T + MAX_SEGMENT_SPAN_MS)));
    }

    #[test]
    fn bounds_reject_missing_reversed_nonpositive_and_oversized() {
        assert_eq!(client_bounds_ms(None, None), None);
        assert_eq!(client_bounds_ms(Some(T), None), None);
        assert_eq!(client_bounds_ms(None, Some(T)), None);
        assert_eq!(client_bounds_ms(Some(T + 1), Some(T)), None);
        assert_eq!(client_bounds_ms(Some(0), Some(T)), None);
        assert_eq!(client_bounds_ms(Some(-1), Some(T)), None);
        assert_eq!(client_bounds_ms(Some(T), Some(T + MAX_SEGMENT_SPAN_MS + 1)), None);
        assert_eq!(client_bounds_ms(Some(1), Some(i64::MAX)), None);
        assert_eq!(client_bounds_ms(Some(i64::MIN), Some(i64::MAX)), None);
    }

    #[test]
    fn store_errors_map_to_upload_outcomes() {
        let invalid = store_error(StoreError::InvalidPayload("bad".to_string()));
        assert_eq!((invalid.outcome, invalid.status), (UploadOutcome::Invalid, StatusCode::BAD_REQUEST));
        let storage = store_error(StoreError::Storage(anyhow::anyhow!("bucket down")));
        assert_eq!((storage.outcome, storage.status), (UploadOutcome::StorageError, StatusCode::INTERNAL_SERVER_ERROR));
    }

    #[test]
    fn only_stored_segments_count_bytes() {
        assert_eq!(upload_outcome(&Ok(Uploaded::Stored { bytes: 42 })), (UploadOutcome::Stored, 42));
        assert_eq!(upload_outcome(&Ok(Uploaded::Duplicate)), (UploadOutcome::Duplicate, 0));
        let rate_limited = Rejection::new(UploadOutcome::RateLimited, StatusCode::TOO_MANY_REQUESTS, "rate limited");
        assert_eq!(upload_outcome(&Err(rate_limited)), (UploadOutcome::RateLimited, 0));
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

    fn replay_meta(bounds: (i64, i64)) -> SessionReplayMetaRow {
        let received_at = DateTime::from_timestamp_millis(T).unwrap();
        SessionReplayMetaRow {
            started_at: received_at,
            ended_at: received_at,
            size_bytes: 0,
            start_url: String::new(),
            event_count: 0,
            visitor_id: 1,
            client_started_at_ms: bounds.0,
            client_ended_at_ms: bounds.1,
            error_fingerprints: Vec::new(),
            recorded_error_count: 0,
            rage_click_count: 0,
            dead_click_count: 0,
        }
    }

    fn chunk_errors(fingerprints: &[&str], count: u32) -> envelope::ChunkErrors {
        envelope::ChunkErrors {
            fingerprints: fingerprints.iter().map(|f| f.to_string()).collect(),
            count,
        }
    }

    #[test]
    fn chunk_errors_union_fingerprints_and_accumulate_counts() {
        let mut meta = replay_meta((T, T));
        merge_chunk_errors(&mut meta, chunk_errors(&["b", "a"], 2));
        merge_chunk_errors(&mut meta, chunk_errors(&["c", "a"], 3));
        assert_eq!(meta.error_fingerprints, vec!["a", "b", "c"]);
        assert_eq!(meta.recorded_error_count, 5);
        meta.recorded_error_count = u32::MAX - 1;
        merge_chunk_errors(&mut meta, chunk_errors(&[], 5));
        assert_eq!(meta.recorded_error_count, u32::MAX);
    }

    #[test]
    fn raw_chunks_preserve_loaded_fingerprints_and_counts() {
        let mut meta = replay_meta((T, T));
        meta.error_fingerprints = vec!["a".to_string()];
        meta.recorded_error_count = 4;
        merge_chunk_errors(&mut meta, envelope::ChunkErrors::default());
        assert_eq!(meta.error_fingerprints, vec!["a"]);
        assert_eq!(meta.recorded_error_count, 4);
    }

    #[test]
    fn click_counts_are_capped_at_the_chunk_event_count() {
        assert_eq!(chunk_click_count(Some(2), Some(40)), 2);
        assert_eq!(chunk_click_count(Some(40), Some(40)), 40);
        assert_eq!(chunk_click_count(Some(41), Some(40)), 0);
        assert_eq!(chunk_click_count(Some(1), None), 0);
        assert_eq!(chunk_click_count(None, Some(40)), 0);
    }

    fn merge_all(chunks: &[(i64, i64)]) -> SessionReplayMetaRow {
        let mut meta: Option<SessionReplayMetaRow> = None;
        for &chunk in chunks {
            meta = Some(replay_meta(merged_client_bounds(meta.as_ref(), chunk)));
        }
        meta.unwrap()
    }

    #[test]
    fn retried_overlapping_and_out_of_order_chunks_give_the_client_range() {
        let meta = merge_all(&[
            (T + 30_000, T + 60_000),
            (T, T + 45_000),
            (T, T + 45_000),
            (T + 10_000, T + 20_000),
            (T + 60_000, T + 90_000),
            (T + 60_000, T + 90_000),
        ]);
        assert_eq!((meta.client_started_at_ms, meta.client_ended_at_ms), (T, T + 90_000));
        assert_eq!(replay_duration_seconds(&meta), 90);
    }

    #[test]
    fn duration_is_independent_of_the_client_clock_offset() {
        for offset in [0, THREE_DAYS_MS, -THREE_DAYS_MS] {
            let start = T + offset;
            let meta = merge_all(&[(start, start + 30_000), (start + 30_000, start + 60_000)]);
            assert_eq!(replay_duration_seconds(&meta), 60);
        }
    }

    #[test]
    fn started_at_estimate_cancels_the_client_clock_offset_and_upload_latency() {
        let true_start = DateTime::from_timestamp_millis(T).unwrap();
        let ms = chrono::Duration::milliseconds;
        for offset in [0, THREE_DAYS_MS, -THREE_DAYS_MS] {
            let client_start = T + offset;
            // First chunk covers 15s of recording and arrives 300ms after its last event.
            let first = estimated_started_at(true_start + ms(15_300), client_start + 15_000, client_start);
            assert_eq!(first, true_start + ms(300));
            // A later chunk with a faster upload gives a tighter estimate.
            let second = estimated_started_at(true_start + ms(60_050), client_start + 60_000, client_start);
            assert_eq!(second, true_start + ms(50));
            // A retry of the first chunk arrives much later and estimates later, so min() ignores it.
            let retry = estimated_started_at(true_start + ms(120_000), client_start + 15_000, client_start);
            assert!(retry > first);
            assert_eq!(first.min(second).min(retry), second);
        }
    }

    #[test]
    fn rows_without_client_bounds_are_seeded_by_the_first_chunk() {
        let legacy = replay_meta((0, 0));
        assert_eq!(merged_client_bounds(Some(&legacy), (T, T + 30_000)), (T, T + 30_000));
        assert_eq!(merged_client_bounds(None, (T, T + 30_000)), (T, T + 30_000));
    }

    #[test]
    fn duration_truncates_to_whole_seconds_and_saturates() {
        assert_eq!(replay_duration_seconds(&replay_meta((T + 1, T + 1999))), 1);
        assert_eq!(replay_duration_seconds(&replay_meta((T, T))), 0);
        assert_eq!(replay_duration_seconds(&replay_meta((1, i64::MAX))), u32::MAX);
    }
}
