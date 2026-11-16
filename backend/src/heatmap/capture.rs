//! Heatmap capture uploads: an editor's browser sends one rrweb full snapshot per one-time
//! capture link. The dashboard mints the link; only its SHA-256 hash is stored in Postgres.
//! The link is used up in the same transaction that stores the capture, so a refused upload
//! can be retried and two concurrent uploads with one link store at most one capture.

use std::sync::Arc;

use axum::{
    Json,
    extract::{Query, State, rejection::{BytesRejection, QueryRejection}},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
};
use bytes::Bytes;
use once_cell::sync::Lazy;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use tokio::sync::Semaphore;
use tracing::{error, warn};
use url::Url;

use super::{MAX_DOCUMENT_HEIGHT, MAX_VIEWPORT_WIDTH, device_from_viewport};
use crate::config::ReplayStorage;
use crate::db::{HeatmapCaptureRow, SharedDatabase};
use crate::metrics::MetricsCollector;
use crate::postgres::{PostgresError, PostgresPool};
use crate::session_replay::store::{GunzipError, gunzip_capped};
use crate::storage::s3::S3Service;
use crate::url_utils::extract_domain_and_path_from_url;

/// As uploaded (gzip or plain); the route's body limit sits just above this so an oversized
/// body still reaches the handler's link check and gets the too_large reason.
pub const MAX_UPLOAD_BYTES: usize = 10 * 1024 * 1024;
pub const BODY_LIMIT_BYTES: usize = MAX_UPLOAD_BYTES + 1;
const MAX_UNPACKED_BYTES: u64 = 40 * 1024 * 1024;
const MAX_TOKEN_CHARS: usize = 128;
const KEPT_PER_PAGE_AND_DEVICE: i64 = 10;
/// Outside the replay `site/` prefix, so the documented replay expiry rule never matches
const S3_PREFIX: &str = "heatmap-captures/";

// A 40 MB snapshot takes real CPU to inflate and parse; captures are rare, so keep it to a few.
static DECODE_PERMITS: Lazy<Semaphore> = Lazy::new(|| Semaphore::new(2));

pub enum CaptureStore {
    ClickHouse(SharedDatabase),
    S3(Arc<S3Service>),
}

pub struct CaptureCtx {
    pub pool: Arc<PostgresPool>,
    pub db: SharedDatabase,
    pub s3: Option<Arc<S3Service>>,
    pub mode: ReplayStorage,
    pub metrics: Option<Arc<MetricsCollector>>,
}

impl CaptureCtx {
    /// None when REPLAY_STORAGE selects S3 but S3 is not configured
    fn store(&self) -> Option<CaptureStore> {
        match self.mode {
            ReplayStorage::ClickHouse => Some(CaptureStore::ClickHouse(self.db.clone())),
            ReplayStorage::S3 => self.s3.clone().map(CaptureStore::S3),
        }
    }
}

#[derive(Deserialize)]
pub struct CaptureParams {
    viewport_width: Option<u32>,
    document_height: Option<u32>,
    encoding: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Reason {
    LinkInvalid,
    WrongOrigin,
    WrongViewport,
    WrongPage,
    TooLarge,
    Invalid,
    StorageUnavailable,
    Internal,
}

impl Reason {
    fn as_str(self) -> &'static str {
        match self {
            Self::LinkInvalid => "link_invalid",
            Self::WrongOrigin => "wrong_origin",
            Self::WrongViewport => "wrong_viewport",
            Self::WrongPage => "wrong_page",
            Self::TooLarge => "too_large",
            Self::Invalid => "invalid",
            Self::StorageUnavailable => "storage_unavailable",
            Self::Internal => "internal",
        }
    }

    fn status(self) -> StatusCode {
        match self {
            Self::LinkInvalid => StatusCode::UNAUTHORIZED,
            Self::WrongOrigin => StatusCode::FORBIDDEN,
            Self::WrongViewport | Self::WrongPage => StatusCode::UNPROCESSABLE_ENTITY,
            Self::TooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            Self::Invalid => StatusCode::BAD_REQUEST,
            Self::StorageUnavailable => StatusCode::SERVICE_UNAVAILABLE,
            Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

/// The tracker panel shows `message`; `reason` is stable for code
#[derive(Debug)]
struct Refusal {
    reason: Reason,
    message: String,
}

impl Refusal {
    fn new(reason: Reason, message: impl Into<String>) -> Self {
        Self { reason, message: message.into() }
    }

    fn link_invalid() -> Self {
        Self::new(Reason::LinkInvalid, "This capture link has expired or was already used. Start a new capture from the dashboard.")
    }

    fn internal() -> Self {
        Self::new(Reason::Internal, "The capture could not be saved. Try again.")
    }
}

impl From<PostgresError> for Refusal {
    fn from(e: PostgresError) -> Self {
        error!("Heatmap capture Postgres error: {}", e);
        Refusal::internal()
    }
}

impl From<tokio_postgres::Error> for Refusal {
    fn from(e: tokio_postgres::Error) -> Self {
        PostgresError::from(e).into()
    }
}

struct Link {
    id: String,
    dashboard_id: String,
    path: String,
    device: String,
    created_by_id: String,
    site_id: String,
    domain: String,
}

struct Snapshot {
    /// The body as uploaded, kept for S3 so gzip bodies stay compressed at rest
    raw: Bytes,
    gzip: bool,
    text: String,
    /// Path of the page the snapshot was taken on, from the rrweb meta event
    page_path: String,
}

pub async fn upload_capture(
    State(ctx): State<Arc<CaptureCtx>>,
    headers: HeaderMap,
    query: Result<Query<CaptureParams>, QueryRejection>,
    body: Result<Bytes, BytesRejection>,
) -> Response {
    let result = store_capture(&ctx, &headers, query, body).await;
    let outcome = match &result {
        Ok(_) => "stored",
        Err(r) => r.reason.as_str(),
    };
    if let Some(m) = &ctx.metrics {
        m.increment_heatmap_capture_uploads(outcome);
    }
    match result {
        Ok(capture_id) => (StatusCode::CREATED, Json(serde_json::json!({ "capture_id": capture_id }))).into_response(),
        Err(r) => (
            r.reason.status(),
            Json(serde_json::json!({ "reason": r.reason.as_str(), "message": r.message })),
        )
            .into_response(),
    }
}

async fn store_capture(
    ctx: &CaptureCtx,
    headers: &HeaderMap,
    query: Result<Query<CaptureParams>, QueryRejection>,
    body: Result<Bytes, BytesRejection>,
) -> Result<String, Refusal> {
    let token = bearer_token(headers).ok_or_else(Refusal::link_invalid)?;
    let link = find_link(&ctx.pool, &hash_token(token)).await?.ok_or_else(Refusal::link_invalid)?;

    let origin = headers.get(header::ORIGIN).and_then(|v| v.to_str().ok());
    if !origin_allowed(&link.domain, origin) {
        return Err(Refusal::new(
            Reason::WrongOrigin,
            format!("This page is not on {} or one of its subdomains, so it can't be captured for this dashboard.", link.domain),
        ));
    }

    let Query(params) = query.map_err(|_| Refusal::new(Reason::Invalid, "Invalid capture parameters."))?;
    let viewport_width = params.viewport_width.filter(|w| (1..=MAX_VIEWPORT_WIDTH).contains(w));
    let document_height = params.document_height.filter(|h| (1..=MAX_DOCUMENT_HEIGHT).contains(h));
    let (Some(viewport_width), Some(document_height)) = (viewport_width, document_height) else {
        return Err(Refusal::new(Reason::Invalid, "Invalid viewport width or page height."));
    };
    check_viewport(&link.device, viewport_width)?;

    let body = match body {
        Ok(body) => body,
        Err(e) if e.status() == StatusCode::PAYLOAD_TOO_LARGE => return Err(too_large()),
        Err(_) => return Err(Refusal::new(Reason::Invalid, "The capture could not be read.")),
    };
    if body.len() > MAX_UPLOAD_BYTES {
        return Err(too_large());
    }
    if body.is_empty() {
        return Err(Refusal::new(Reason::Invalid, "The capture is empty."));
    }
    let gzip = match params.encoding.as_deref() {
        None => false,
        Some("gzip") => true,
        Some(_) => return Err(Refusal::new(Reason::Invalid, "Unsupported encoding.")),
    };

    let store = ctx.store().ok_or_else(|| {
        Refusal::new(Reason::StorageUnavailable, "Capture storage is not configured on this server (REPLAY_STORAGE=s3 without S3).")
    })?;

    let snapshot = decode(body, gzip).await?;
    if !page_matches(&link.path, &snapshot.page_path) {
        return Err(Refusal::new(
            Reason::WrongPage,
            format!(
                "This capture link is for {}, but this page is {}. Open the link on a matching page and try again.",
                link.path, snapshot.page_path
            ),
        ));
    }
    let captured_from = snapshot.page_path.clone();
    let capture_id = uuid::Uuid::new_v4().simple().to_string();
    let storage_key = storage_key(ctx.mode, &link.site_id, &capture_id);

    let mut conn = ctx.pool.connection().await?;
    let tx = conn.transaction().await?;
    let claimed = tx
        .execute(
            r#"UPDATE "HeatmapCaptureLink" SET "usedAt" = timezone('utc', now())
               WHERE "id" = $1 AND "usedAt" IS NULL AND "expiresAt" > timezone('utc', now())"#,
            &[&link.id],
        )
        .await?;
    if claimed == 0 {
        return Err(Refusal::link_invalid());
    }

    let size_bytes = snapshot.text.len() as i32;
    put_snapshot(&store, &link.site_id, &capture_id, &storage_key, snapshot).await?;

    let insert = async {
        tx.execute(
            r#"INSERT INTO "HeatmapCapture"
                 ("id", "dashboardId", "path", "device", "viewportWidth", "documentHeight",
                  "storage", "storageKey", "sizeBytes", "createdById", "capturedFromPath", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, timezone('utc', now()))"#,
            &[
                &capture_id,
                &link.dashboard_id,
                &link.path,
                &link.device,
                &(viewport_width as i32),
                &(document_height as i32),
                &ctx.mode.as_str(),
                &storage_key,
                &size_bytes,
                &link.created_by_id,
                &captured_from,
            ],
        )
        .await?;
        tx.commit().await
    };
    if let Err(e) = insert.await {
        error!(dashboard_id = %link.dashboard_id, "Failed to record heatmap capture, removing its snapshot: {}", e);
        if let Err(e) = delete_snapshots(ctx, &link.site_id, &[(ctx.mode.as_str().to_string(), storage_key)]).await {
            error!(dashboard_id = %link.dashboard_id, "Failed to remove orphaned heatmap capture snapshot: {}", e);
        }
        return Err(Refusal::internal());
    }
    drop(conn);

    if let Err(e) = trim_history(ctx, &link).await {
        warn!(dashboard_id = %link.dashboard_id, "Failed to trim heatmap capture history, retried on the next capture: {}", e);
    }

    Ok(capture_id)
}

fn too_large() -> Refusal {
    Refusal::new(Reason::TooLarge, "This page is too large to capture (over 10 MB compressed or 40 MB unpacked).")
}

fn bearer_token(headers: &HeaderMap) -> Option<&str> {
    let value = headers.get(header::AUTHORIZATION)?.to_str().ok()?;
    let token = value.strip_prefix("Bearer ")?.trim();
    (!token.is_empty() && token.len() <= MAX_TOKEN_CHARS).then_some(token)
}

fn hash_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

/// Same rule as the site's "enforce domain" setting: the dashboard's domain or a subdomain,
/// applied whether or not the site enforces its domain for events
fn origin_allowed(domain: &str, origin: Option<&str>) -> bool {
    let expected = domain.trim().to_ascii_lowercase();
    let Some(host) = origin.and_then(|o| Url::parse(o).ok()).and_then(|u| u.host_str().map(str::to_ascii_lowercase)) else {
        return false;
    };
    !expected.is_empty() && (host == expected || host.ends_with(&format!(".{}", expected)))
}

fn check_viewport(device: &str, viewport_width: u32) -> Result<(), Refusal> {
    if device_from_viewport(viewport_width) == device {
        return Ok(());
    }
    let expected = match device {
        "phone" => "Phone link needs a window under 576 px wide",
        "tablet" => "Tablet link needs a window 576 to 991 px wide",
        _ => "Desktop link needs a window at least 992 px wide",
    };
    Err(Refusal::new(
        Reason::WrongViewport,
        format!("This window is {} px wide, but this {}. Resize the window and try again.", viewport_width, expected),
    ))
}

async fn find_link(pool: &PostgresPool, token_hash: &str) -> Result<Option<Link>, Refusal> {
    let conn = pool.connection().await?;
    let row = conn
        .query_opt(
            r#"SELECT l."id", l."dashboardId", l."path", l."device", l."createdById", d."siteId", d."domain"
               FROM "HeatmapCaptureLink" l
               JOIN "Dashboard" d ON d."id" = l."dashboardId"
               WHERE l."tokenHash" = $1
                 AND l."usedAt" IS NULL
                 AND l."expiresAt" > timezone('utc', now())
                 AND d."deletedAt" IS NULL"#,
            &[&token_hash],
        )
        .await?;
    Ok(row.map(|r| Link {
        id: r.get(0),
        dashboard_id: r.get(1),
        path: r.get(2),
        device: r.get(3),
        created_by_id: r.get(4),
        site_id: r.get(5),
        domain: r.get(6),
    }))
}

async fn decode(raw: Bytes, gzip: bool) -> Result<Snapshot, Refusal> {
    let _permit = DECODE_PERMITS.acquire().await.map_err(|_| Refusal::internal())?;
    let bytes = raw.clone();
    let (text, page_path) = tokio::task::spawn_blocking(move || decode_snapshot(&bytes, gzip))
        .await
        .map_err(|e| {
            error!("Heatmap capture decode task failed: {}", e);
            Refusal::internal()
        })??;
    Ok(Snapshot { raw, gzip, text, page_path })
}

#[derive(Deserialize)]
struct RrwebEvent {
    #[serde(rename = "type")]
    kind: u8,
    data: Option<RrwebEventData>,
}

/// Only the meta event's page address is read; the snapshot itself is skipped over unparsed
#[derive(Deserialize)]
struct RrwebEventData {
    href: Option<String>,
}

/// Returns the snapshot text and the path of the page it was taken on
fn decode_snapshot(bytes: &[u8], gzip: bool) -> Result<(String, String), Refusal> {
    let text = if gzip {
        gunzip_capped(bytes, MAX_UNPACKED_BYTES).map_err(|e| match e {
            GunzipError::TooLarge => too_large(),
            GunzipError::Invalid(msg) => Refusal::new(Reason::Invalid, format!("The capture could not be read ({}).", msg)),
        })?
    } else {
        String::from_utf8(bytes.to_vec()).map_err(|_| Refusal::new(Reason::Invalid, "The capture could not be read (not valid UTF-8)."))?
    };
    const FULL_SNAPSHOT: u8 = 2;
    const META: u8 = 4;
    let events: Vec<RrwebEvent> = serde_json::from_str(&text)
        .map_err(|_| Refusal::new(Reason::Invalid, "The capture is not an rrweb events array."))?;
    if !events.iter().any(|e| e.kind == FULL_SNAPSHOT) {
        return Err(Refusal::new(Reason::Invalid, "The capture has no full page snapshot."));
    }
    let href = events
        .iter()
        .filter(|e| e.kind == META)
        .find_map(|e| e.data.as_ref()?.href.as_deref())
        .filter(|href| Url::parse(href).is_ok())
        .ok_or_else(|| Refusal::new(Reason::Invalid, "The capture has no page address."))?;
    let (_, page_path) = extract_domain_and_path_from_url(href);
    Ok((text, page_path))
}

/// The tracker's `data-dynamic-urls` grouping stores each wildcard as `*`, also for `**`
/// patterns that span several segments, so a `*` here stands for one or more characters.
/// Mirrors `matchesPagePath` in the dashboard.
fn page_matches(page_path: &str, path: &str) -> bool {
    let parts: Vec<&str> = page_path.split('*').collect();
    if parts.len() == 1 {
        return path == page_path;
    }
    let Some(mut rest) = path.strip_prefix(parts[0]) else {
        return false;
    };
    for part in &parts[1..parts.len() - 1] {
        let Some(skip) = rest.chars().next().map(char::len_utf8) else {
            return false;
        };
        let Some(found) = rest[skip..].find(part) else {
            return false;
        };
        rest = &rest[skip + found + part.len()..];
    }
    let last = parts[parts.len() - 1];
    rest.len() > last.len() && rest.ends_with(last)
}

fn storage_key(mode: ReplayStorage, site_id: &str, capture_id: &str) -> String {
    match mode {
        ReplayStorage::ClickHouse => capture_id.to_string(),
        ReplayStorage::S3 => format!("{}site/{}/{}.json", S3_PREFIX, site_id, capture_id),
    }
}

async fn put_snapshot(store: &CaptureStore, site_id: &str, capture_id: &str, key: &str, snapshot: Snapshot) -> Result<(), Refusal> {
    let result = match store {
        CaptureStore::ClickHouse(db) => {
            db.insert_heatmap_capture(HeatmapCaptureRow {
                site_id: site_id.to_string(),
                capture_id: capture_id.to_string(),
                size_bytes: snapshot.text.len() as u64,
                data: snapshot.text,
            })
            .await
        }
        CaptureStore::S3(s3) => s3.put_segment(key, snapshot.raw, snapshot.gzip.then_some("gzip")).await,
    };
    result.map_err(|e| {
        error!(site_id, "Failed to store heatmap capture snapshot: {}", e);
        Refusal::internal()
    })
}

/// Deletes snapshots by the storage each capture row recorded, which may differ from the
/// current mode when an install switched REPLAY_STORAGE
async fn delete_snapshots(ctx: &CaptureCtx, site_id: &str, captures: &[(String, String)]) -> anyhow::Result<()> {
    let clickhouse_ids: Vec<String> = captures
        .iter()
        .filter(|(storage, _)| storage == ReplayStorage::ClickHouse.as_str())
        .map(|(_, key)| key.clone())
        .collect();
    if !clickhouse_ids.is_empty() {
        ctx.db.delete_heatmap_captures(site_id, &clickhouse_ids).await?;
    }
    for (_, key) in captures.iter().filter(|(storage, _)| storage == ReplayStorage::S3.as_str()) {
        let s3 = ctx.s3.as_ref().ok_or_else(|| anyhow::anyhow!("S3 is not configured"))?;
        s3.delete_object(key).await?;
    }
    Ok(())
}

/// Keeps the newest captures per page and device. Snapshots go first, so a failed delete
/// leaves the row behind to retry on the next capture rather than orphaning a snapshot.
async fn trim_history(ctx: &CaptureCtx, link: &Link) -> anyhow::Result<()> {
    let conn = ctx.pool.connection().await?;
    let rows = conn
        .query(
            r#"SELECT "id", "storage", "storageKey" FROM "HeatmapCapture"
               WHERE "dashboardId" = $1 AND "path" = $2 AND "device" = $3
               ORDER BY "createdAt" DESC, "id" DESC
               OFFSET $4"#,
            &[&link.dashboard_id, &link.path, &link.device, &KEPT_PER_PAGE_AND_DEVICE],
        )
        .await?;
    if rows.is_empty() {
        return Ok(());
    }
    let ids: Vec<String> = rows.iter().map(|r| r.get(0)).collect();
    let snapshots: Vec<(String, String)> = rows.iter().map(|r| (r.get(1), r.get(2))).collect();
    delete_snapshots(ctx, &link.site_id, &snapshots).await?;
    conn.execute(r#"DELETE FROM "HeatmapCapture" WHERE "id" = ANY($1)"#, &[&ids]).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn gzip(data: &[u8]) -> Vec<u8> {
        let mut encoder = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
        encoder.write_all(data).unwrap();
        encoder.finish().unwrap()
    }

    const SNAPSHOT: &str = r#"[{"type":4,"data":{"href":"https://example.com/","width":390,"height":844},"timestamp":1},{"type":2,"data":{"node":{"type":0,"childNodes":[]},"initialOffset":{"top":0,"left":0}},"timestamp":2}]"#;

    #[test]
    fn origin_follows_the_enforce_domain_rule() {
        assert!(origin_allowed("example.com", Some("https://example.com")));
        assert!(origin_allowed("example.com", Some("https://shop.example.com:8443")));
        assert!(origin_allowed("Example.com ", Some("https://WWW.EXAMPLE.COM")));
        assert!(!origin_allowed("example.com", Some("https://notexample.com")));
        assert!(!origin_allowed("example.com", Some("https://example.com.evil.io")));
        assert!(!origin_allowed("example.com", Some("null")));
        assert!(!origin_allowed("example.com", None));
        assert!(!origin_allowed("", Some("https://example.com")));
    }

    #[test]
    fn viewport_must_fit_the_link_device() {
        assert!(check_viewport("phone", 390).is_ok());
        assert!(check_viewport("phone", 575).is_ok());
        assert_eq!(check_viewport("phone", 1200).unwrap_err().reason, Reason::WrongViewport);
        assert!(check_viewport("tablet", 576).is_ok());
        assert!(check_viewport("tablet", 991).is_ok());
        assert_eq!(check_viewport("tablet", 992).unwrap_err().reason, Reason::WrongViewport);
        assert!(check_viewport("desktop", 992).is_ok());
        assert_eq!(check_viewport("desktop", 991).unwrap_err().reason, Reason::WrongViewport);
    }

    #[test]
    fn bearer_token_is_required_and_bounded() {
        let mut headers = HeaderMap::new();
        assert_eq!(bearer_token(&headers), None);
        headers.insert(header::AUTHORIZATION, "Bearer abc".parse().unwrap());
        assert_eq!(bearer_token(&headers), Some("abc"));
        headers.insert(header::AUTHORIZATION, "Basic abc".parse().unwrap());
        assert_eq!(bearer_token(&headers), None);
        headers.insert(header::AUTHORIZATION, format!("Bearer {}", "a".repeat(MAX_TOKEN_CHARS + 1)).parse().unwrap());
        assert_eq!(bearer_token(&headers), None);
    }

    #[test]
    fn token_hash_matches_the_dashboard() {
        // sha256("abc"), as the dashboard's createHash('sha256').digest('hex') stores it
        assert_eq!(hash_token("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    #[test]
    fn decodes_plain_and_gzip_snapshots() {
        let expected = (SNAPSHOT.to_string(), "/".to_string());
        assert_eq!(decode_snapshot(SNAPSHOT.as_bytes(), false).unwrap(), expected);
        assert_eq!(decode_snapshot(&gzip(SNAPSHOT.as_bytes()), true).unwrap(), expected);
    }

    #[test]
    fn reads_the_page_path_from_the_meta_event() {
        let snapshot = SNAPSHOT.replace("https://example.com/", "https://example.com/profile/betterlytics/posts?tab=new#top");
        assert_eq!(decode_snapshot(snapshot.as_bytes(), false).unwrap().1, "/profile/betterlytics/posts");
    }

    #[test]
    fn refuses_snapshots_without_a_full_snapshot_event() {
        let meta_only = r#"[{"type":4,"data":{"href":"https://example.com/"},"timestamp":1}]"#;
        assert_eq!(decode_snapshot(meta_only.as_bytes(), false).unwrap_err().reason, Reason::Invalid);
        assert_eq!(decode_snapshot(b"{\"type\":2}", false).unwrap_err().reason, Reason::Invalid);
        assert_eq!(decode_snapshot(b"not json", false).unwrap_err().reason, Reason::Invalid);
        assert_eq!(decode_snapshot(b"[{\"type\":2}]", true).unwrap_err().reason, Reason::Invalid);
    }

    #[test]
    fn refuses_snapshots_without_a_page_address() {
        let no_meta = r#"[{"type":2,"data":{"node":{"type":0,"childNodes":[]}},"timestamp":2}]"#;
        let refusal = decode_snapshot(no_meta.as_bytes(), false).unwrap_err();
        assert_eq!((refusal.reason, refusal.message.as_str()), (Reason::Invalid, "The capture has no page address."));
        let bad_href = SNAPSHOT.replace("https://example.com/", "not a url");
        assert_eq!(decode_snapshot(bad_href.as_bytes(), false).unwrap_err().reason, Reason::Invalid);
    }

    #[test]
    fn page_paths_match_literally_without_wildcards() {
        assert!(page_matches("/pricing", "/pricing"));
        assert!(!page_matches("/pricing", "/pricing/"));
        assert!(!page_matches("/pricing", "/about"));
        assert!(page_matches("/", "/"));
    }

    #[test]
    fn page_path_wildcards_stand_for_one_or_more_characters() {
        assert!(page_matches("/profile/*/posts", "/profile/betterlytics/posts"));
        assert!(page_matches("/profile/*/posts", "/profile/a/b/posts"));
        assert!(!page_matches("/profile/*/posts", "/profile//posts"));
        assert!(!page_matches("/profile/*/posts", "/profile/betterlytics"));
        assert!(!page_matches("/profile/*/posts", "/settings"));
        assert!(page_matches("/docs/*", "/docs/guide/install"));
        assert!(!page_matches("/docs/*", "/docs/"));
        assert!(page_matches("/*/a/*/b", "/x/a/y/b"));
        assert!(!page_matches("/*/a/*/b", "/x/a/b"));
        assert!(page_matches("/shop/*/*", "/shop/é/ü"));
    }

    #[test]
    fn refuses_snapshots_over_the_unpacked_limit() {
        let mut big = String::from(r#"[{"type":2,"data":""#);
        big.push_str(&"a".repeat(MAX_UNPACKED_BYTES as usize));
        big.push_str(r#""}]"#);
        assert_eq!(decode_snapshot(&gzip(big.as_bytes()), true).unwrap_err().reason, Reason::TooLarge);
    }

    #[test]
    fn s3_keys_sit_outside_the_replay_prefix() {
        let key = storage_key(ReplayStorage::S3, "site1", "abc");
        assert_eq!(key, "heatmap-captures/site/site1/abc.json");
        assert!(!key.starts_with("site/"));
        assert_eq!(storage_key(ReplayStorage::ClickHouse, "site1", "abc"), "abc");
    }
}
