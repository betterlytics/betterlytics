pub mod store;

use std::time::Duration;
use std::sync::Arc;

use axum::{extract::{Query, State}, http::StatusCode};
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
const MAX_SESSION_BYTES: u64 = 50 * 1024 * 1024;
const MAX_SEGMENT_SPAN_MS: i64 = 24 * 60 * 60 * 1000;
const MAX_FILENAME_EPOCH_MS: i64 = 9_999_999_999_999;
const MAX_START_URL_CHARS: usize = 2048;
const MAX_CHUNK_ID_CHARS: usize = 32;

fn segment_span_ms(started_at_ms: Option<i64>, ended_at_ms: Option<i64>) -> Option<i64> {
    let span = match (started_at_ms, ended_at_ms) {
        (Some(started), Some(ended)) => ended.saturating_sub(started).max(0),
        _ => 0,
    };
    (span <= MAX_SEGMENT_SPAN_MS).then_some(span)
}

fn segment_filename_epoch_ms(now_ms: i64, client_ended_at_ms: Option<i64>) -> i64 {
    match client_ended_at_ms {
        Some(t) => t.clamp(0, MAX_FILENAME_EPOCH_MS),
        None => now_ms,
    }
}

fn client_bounds_ms(started_at_ms: Option<i64>, ended_at_ms: Option<i64>) -> Option<(i64, i64)> {
    started_at_ms.zip(ended_at_ms).filter(|(start, end)| end >= start)
}

fn merge_replay_timing(
    meta: &mut SessionReplayMetaRow,
    incoming: Option<(i64, i64)>,
    received_at: DateTime<Utc>,
) {
    meta.ended_at = meta.ended_at.max(received_at);
    if meta.client_bounds_complete == 1 {
        if let Some((start, end)) = incoming {
            meta.client_started_at_ms = meta.client_started_at_ms.min(start);
            meta.client_ended_at_ms = meta.client_ended_at_ms.max(end);
        } else {
            meta.client_bounds_complete = 0;
        }
    }
    meta.duration = replay_duration_seconds(meta);
}

fn replay_duration_seconds(meta: &SessionReplayMetaRow) -> u32 {
    if meta.client_bounds_complete != 1 {
        return meta.duration;
    }
    let elapsed_ms = i128::from(meta.client_ended_at_ms) - i128::from(meta.client_started_at_ms);
    (elapsed_ms / 1000).clamp(0, i128::from(u32::MAX)) as u32
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
    State((db, processor, metrics, _, replay_ctx, site_cfg_cache)): State<(SharedDatabase, Arc<EventProcessor>, Option<Arc<MetricsCollector>>, Arc<EventValidator>, Option<Arc<ReplayCtx>>, Arc<SiteConfigCache>)>,
    client: ClientRequest,
    Query(p): Query<UploadSegmentParams>,
    body: Bytes,
) -> Result<StatusCode, (StatusCode, String)> {
    let replay_ctx = replay_ctx.ok_or((StatusCode::SERVICE_UNAVAILABLE, "session replay not configured".to_string()))?;

    let url = p.url.as_deref().unwrap_or_default();
    if url.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "missing url".to_string()));
    }
    if url.len() > MAX_START_URL_CHARS {
        return Err((StatusCode::BAD_REQUEST, "url too long".to_string()));
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

    if bot_detection::velocity::check_replay(&p.site_id, &client.ip) {
        if let Some(m) = &metrics {
            m.increment_events_rejected("replay_velocity");
        }
        warn!(site_id = %p.site_id, "rejected replay segment: velocity limit exceeded");
        return Err((StatusCode::TOO_MANY_REQUESTS, "rate limited".to_string()));
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

    if body.is_empty() || body.len() as u64 > MAX_CONTENT_LENGTH_BYTES {
        return Err((StatusCode::BAD_REQUEST, "invalid content length".to_string()));
    }
    if p.chunk_id.as_deref().is_some_and(|id| !valid_chunk_id(id)) {
        return Err((StatusCode::BAD_REQUEST, "invalid chunk_id".to_string()));
    }

    let gzip = p.encoding.as_deref() == Some("gzip");
    let payload = replay_ctx.store.prepare(body, gzip).await.map_err(store_error)?;
    let stored_len = payload.stored_size();
    let now_ms = Utc::now().timestamp_millis();
    segment_span_ms(p.started_at_ms, p.ended_at_ms).ok_or_else(|| {
        warn!(site_id = %p.site_id, "rejected replay segment with invalid time span");
        (StatusCode::BAD_REQUEST, "invalid timestamp".to_string())
    })?;

    let internal = || (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string());
    let received_at = DateTime::from_timestamp_millis(now_ms).ok_or_else(internal)?;
    let client_bounds = client_bounds_ms(p.started_at_ms, p.ended_at_ms);
    let filename_epoch_ms = segment_filename_epoch_ms(now_ms, p.ended_at_ms);
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
        && replay_ctx.store.exists(&p.site_id, identity.session_id, &filename).await.map_err(store_error)?
    {
        return Ok(StatusCode::NO_CONTENT);
    }
    let loaded = get_or_load_meta(&db, &key, &p.site_id, identity.session_id).await.map_err(|e| {
        error!(site_id = %p.site_id, session_id = identity.session_id, "Failed to load replay meta, rejecting segment for client retry: {}", e);
        (StatusCode::SERVICE_UNAVAILABLE, "temporarily unavailable".to_string())
    })?;
    if let Some(meta) = &loaded {
        if meta.size_bytes.saturating_add(stored_len) > MAX_SESSION_BYTES {
            return Err((StatusCode::TOO_MANY_REQUESTS, "session replay size limit exceeded".to_string()));
        }
    }

    replay_ctx
        .store
        .store(&p.site_id, identity.session_id, &filename, filename_epoch_ms, segment_date, payload)
        .await
        .map_err(store_error)?;

    let mut meta = loaded.unwrap_or_else(|| SessionReplayMetaRow {
        started_at: received_at,
        ended_at: received_at,
        size_bytes: 0,
        start_url: start_url.clone(),
        event_count: 0,
        visitor_id: identity.fingerprint,
        duration: 0,
        client_started_at_ms: client_bounds.map_or(0, |(start, _)| start),
        client_ended_at_ms: client_bounds.map_or(0, |(_, end)| end),
        client_bounds_complete: u8::from(client_bounds.is_some()),
    });
    merge_replay_timing(&mut meta, client_bounds, received_at);
    meta.size_bytes = meta.size_bytes.saturating_add(stored_len);
    meta.event_count = meta.event_count.saturating_add(p.event_count.unwrap_or_default());
    if meta.start_url.is_empty() {
        meta.start_url = start_url;
    }

    META_CACHE.insert(key, meta.clone());
    if let Err(e) = upsert_replay_row(&db, &replay_ctx, &p.site_id, identity.session_id, segment_date, &meta).await {
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
    date: NaiveDate,
    meta: &SessionReplayMetaRow,
) -> anyhow::Result<()> {
    let row = SessionReplayRow {
        site_id: site_id.to_string(),
        session_id,
        visitor_id: meta.visitor_id,
        started_at: meta.started_at,
        ended_at: meta.ended_at,
        duration: meta.duration,
        date,
        size_bytes: meta.size_bytes,
        event_count: meta.event_count,
        s3_prefix: format!("site/{}/sess/{}/", site_id, session_id),
        start_url: meta.start_url.clone(),
        storage: replay_ctx.mode.as_str().to_string(),
        client_started_at_ms: meta.client_started_at_ms,
        client_ended_at_ms: meta.client_ended_at_ms,
        client_bounds_complete: meta.client_bounds_complete,
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

    fn replay_meta(received_at_ms: i64, bounds: Option<(i64, i64)>) -> SessionReplayMetaRow {
        let received_at = DateTime::from_timestamp_millis(received_at_ms).unwrap();
        SessionReplayMetaRow {
            started_at: received_at,
            ended_at: received_at,
            size_bytes: 0,
            start_url: String::new(),
            event_count: 0,
            visitor_id: 1,
            duration: 0,
            client_started_at_ms: bounds.map_or(0, |(start, _)| start),
            client_ended_at_ms: bounds.map_or(0, |(_, end)| end),
            client_bounds_complete: u8::from(bounds.is_some()),
        }
    }

    #[test]
    fn upload_delays_and_client_offsets_do_not_change_duration() {
        for arrivals in [[30_000, 60_000], [30_000, 120_000], [60_000, 65_000]] {
            for offset in [0, THREE_DAYS_MS, -THREE_DAYS_MS] {
                let start = T + offset;
                let mut meta = replay_meta(T + arrivals[0], Some((start, start + 30_000)));
                for (index, arrival) in arrivals.into_iter().enumerate() {
                    let chunk_start = start + index as i64 * 30_000;
                    merge_replay_timing(
                        &mut meta,
                        Some((chunk_start, chunk_start + 30_000)),
                        DateTime::from_timestamp_millis(T + arrival).unwrap(),
                    );
                }
                assert_eq!(meta.duration, 60);
                assert_eq!(meta.started_at.timestamp_millis(), T + arrivals[0]);
                assert_eq!(meta.ended_at.timestamp_millis(), T + arrivals[1]);
            }
        }
    }

    #[test]
    fn client_duration_and_server_receipt_bounds_are_independent() {
        let received_at = DateTime::from_timestamp_millis(T + 40_000).unwrap();
        let mut meta = replay_meta(received_at.timestamp_millis(), Some((T, T + 30_000)));
        merge_replay_timing(&mut meta, Some((T, T + 30_000)), received_at);
        assert_eq!(meta.duration, 30);

        merge_replay_timing(&mut meta, Some((T + 30_000, T + 90_000)), received_at);
        assert_eq!(meta.duration, 90);
        assert_eq!(meta.started_at, received_at);
        assert_eq!(meta.ended_at, received_at);

        let later = received_at + chrono::Duration::minutes(10);
        merge_replay_timing(&mut meta, Some((T + 30_000, T + 90_000)), later);
        assert_eq!(meta.duration, 90);
        assert_eq!(meta.started_at, received_at);
        assert_eq!(meta.ended_at, later);
    }

    #[test]
    fn overlapping_and_out_of_order_chunks_preserve_the_client_range() {
        let mut meta = replay_meta(T + 60_000, Some((T + 30_000, T + 60_000)));
        for (start, end, arrival) in [
            (30_000, 60_000, 60_000),
            (0, 45_000, 90_000),
            (0, 45_000, 90_000),
            (10_000, 20_000, 50_000),
            (60_000, 90_000, 100_000),
        ] {
            merge_replay_timing(
                &mut meta,
                Some((T + start, T + end)),
                DateTime::from_timestamp_millis(T + arrival).unwrap(),
            );
        }
        assert_eq!(meta.duration, 90);
        assert_eq!(meta.client_started_at_ms, T);
        assert_eq!(meta.client_ended_at_ms, T + 90_000);
        assert_eq!(meta.started_at.timestamp_millis(), T + 60_000);
        assert_eq!(meta.ended_at.timestamp_millis(), T + 100_000);
    }

    #[test]
    fn restored_metadata_preserves_recording_history_and_first_receipt() {
        let mut meta: SessionReplayMetaRow = serde_json::from_value(serde_json::json!({
            "started_at": (T + 40_000) / 1000,
            "ended_at": (T + 40_000) / 1000,
            "size_bytes": 100,
            "start_url": "/",
            "event_count": 2,
            "visitor_id": 1,
            "duration": 30,
            "client_started_at_ms": T,
            "client_ended_at_ms": T + 30_000,
            "client_bounds_complete": 1,
        })).unwrap();
        assert_eq!(meta.duration, 30);
        merge_replay_timing(
            &mut meta,
            Some((T + 30_000, T + 60_000)),
            DateTime::from_timestamp_millis(T + 120_000).unwrap(),
        );
        assert_eq!(meta.duration, 60);
        assert_eq!(meta.client_started_at_ms, T);
        assert_eq!(meta.client_ended_at_ms, T + 60_000);
        assert_eq!(meta.started_at.timestamp_millis(), T + 40_000);
        assert_eq!(meta.ended_at.timestamp_millis(), T + 120_000);
    }

    #[test]
    fn legacy_metadata_keeps_its_stored_duration() {
        let mut meta = replay_meta(T, None);
        meta.duration = 75;
        merge_replay_timing(
            &mut meta,
            Some((T, T + 120_000)),
            DateTime::from_timestamp_millis(T + 180_000).unwrap(),
        );
        assert_eq!(meta.duration, 75);
        assert_eq!(meta.client_bounds_complete, 0);
        assert_eq!(meta.started_at.timestamp_millis(), T);
    }

    #[test]
    fn missing_or_reversed_bounds_permanently_preserve_the_last_known_duration() {
        for (start, end) in [(None, None), (Some(T), None), (None, Some(T)), (Some(T + 1), Some(T))] {
            let incoming = client_bounds_ms(start, end);
            assert_eq!(incoming, None);
            let received_at = DateTime::from_timestamp_millis(T + 40_000).unwrap();
            let mut meta = replay_meta(received_at.timestamp_millis(), Some((T, T + 30_000)));
            merge_replay_timing(&mut meta, Some((T, T + 30_000)), received_at);
            merge_replay_timing(&mut meta, incoming, received_at + chrono::Duration::minutes(1));
            assert_eq!(meta.duration, 30);
            assert_eq!(meta.client_bounds_complete, 0);
            merge_replay_timing(
                &mut meta,
                Some((T + 30_000, T + 120_000)),
                received_at + chrono::Duration::minutes(2),
            );
            assert_eq!(meta.duration, 30);
            assert_eq!(meta.client_bounds_complete, 0);
        }
    }

    #[test]
    fn new_replay_without_client_bounds_never_uses_server_elapsed_time() {
        let mut meta = replay_meta(T, None);
        merge_replay_timing(
            &mut meta,
            None,
            DateTime::from_timestamp_millis(T + 600_000).unwrap(),
        );
        assert_eq!(meta.duration, 0);
        assert_eq!(meta.ended_at.timestamp_millis(), T + 600_000);
    }

    #[test]
    fn client_duration_handles_epoch_zero_subseconds_and_extreme_ranges() {
        for (start, end, duration) in [(0, 0, 0), (1001, 1999, 0), (-500, 500, 1)] {
            let bounds = client_bounds_ms(Some(start), Some(end));
            assert_eq!(bounds, Some((start, end)));
            let mut meta = replay_meta(T, bounds);
            merge_replay_timing(&mut meta, bounds, DateTime::from_timestamp_millis(T).unwrap());
            assert_eq!(meta.duration, duration);
        }
        let first = Some((i64::MIN, i64::MIN + 1000));
        let mut meta = replay_meta(T, first);
        merge_replay_timing(&mut meta, first, DateTime::from_timestamp_millis(T).unwrap());
        assert_eq!(meta.duration, 1);
        merge_replay_timing(
            &mut meta,
            Some((i64::MAX - 1000, i64::MAX)),
            DateTime::from_timestamp_millis(T + 1000).unwrap(),
        );
        assert_eq!(meta.duration, u32::MAX);
    }
}
