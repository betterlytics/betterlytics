//! Heatmap click ingestion: the collector sends one batch of clicks per page view,
//! stored as one `analytics.heatmap_clicks` row per click.

use std::sync::Arc;

use axum::{
    extract::{State, rejection::BytesRejection},
    http::StatusCode,
};
use bytes::Bytes;
use chrono::{DateTime, Utc};
use serde::Deserialize;
use tokio::sync::mpsc::{Sender, error::TrySendError};
use tracing::{debug, warn};
use url::Url;

use crate::analytics::{VisitorAttrs, detect_device_type_from_resolution_with_fallback};
use crate::bot_detection;
use crate::client_request::ClientRequest;
use crate::db::HeatmapClickRow;
use crate::metrics::MetricsCollector;
use crate::processing::EventProcessor;
use crate::site_config::SiteConfigCache;
use crate::ua_parser;
use crate::url_utils::{extract_domain_and_path_from_url, extract_root_domain};
use crate::validation::validate_site_policies;
use crate::visitor;

pub const MAX_BATCH_BYTES: usize = 64 * 1024;
const MAX_CLICKS_PER_BATCH: usize = 200;
const MAX_SELECTOR_CHARS: usize = 200;
const MAX_SITE_ID_CHARS: usize = 100;
const MAX_URL_CHARS: usize = 2048;
const MAX_SCREEN_RESOLUTION_CHARS: usize = 32;
const MAX_VIEWPORT_WIDTH: u32 = 16_384;
const MAX_DOCUMENT_HEIGHT: u32 = 1_000_000;
const MAX_CLICK_AGE_MS: f64 = 24.0 * 60.0 * 60.0 * 1000.0;

pub struct HeatmapCtx {
    pub processor: Arc<EventProcessor>,
    pub metrics: Option<Arc<MetricsCollector>>,
    pub site_cfg_cache: Arc<SiteConfigCache>,
    pub click_tx: Sender<HeatmapClickRow>,
}

#[derive(Deserialize)]
struct ClickBatch {
    site_id: String,
    url: String,
    /// Same value the pageview sent, so the batch resolves to the pageview's session
    #[serde(default)]
    screen_resolution: String,
    viewport_width: u32,
    document_height: u32,
    clicks: Vec<RawClick>,
}

#[derive(Deserialize)]
struct RawClick {
    page_x: f64,
    page_y: f64,
    selector: String,
    /// Position inside the element as fractions of its width and height
    offset_x: f64,
    offset_y: f64,
    /// Element is position: fixed or sticky
    #[serde(default)]
    fixed: bool,
    /// How long before the batch was sent the click happened; avoids trusting the client clock
    #[serde(default)]
    ms_ago: f64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum RefuseReason {
    Invalid,
    TooLarge,
    Blocked,
    RateLimited,
}

impl RefuseReason {
    fn as_str(self) -> &'static str {
        match self {
            Self::Invalid => "invalid",
            Self::TooLarge => "too_large",
            Self::Blocked => "blocked",
            Self::RateLimited => "rate_limited",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DropReason {
    Selector,
    Position,
    Offset,
}

impl DropReason {
    fn as_str(self) -> &'static str {
        match self {
            Self::Selector => "selector",
            Self::Position => "position",
            Self::Offset => "offset",
        }
    }
}

struct Refusal {
    reason: RefuseReason,
    status: StatusCode,
    message: String,
}

impl Refusal {
    fn new(reason: RefuseReason, status: StatusCode, message: impl Into<String>) -> Self {
        Self { reason, status, message: message.into() }
    }

    fn invalid(message: impl Into<String>) -> Self {
        Self::new(RefuseReason::Invalid, StatusCode::BAD_REQUEST, message)
    }
}

/// Takes raw bytes rather than `Json` so the collector can send a text body, which
/// sendBeacon and keepalive fetch deliver without a CORS preflight
pub async fn upload_clicks(
    State(ctx): State<Arc<HeatmapCtx>>,
    client: ClientRequest,
    body: Result<Bytes, BytesRejection>,
) -> Result<StatusCode, (StatusCode, String)> {
    let received_at = Utc::now();
    let result = match body {
        Ok(body) => store_clicks(&ctx, &client, &body, received_at).await,
        Err(e) => {
            let reason = if e.status() == StatusCode::PAYLOAD_TOO_LARGE {
                RefuseReason::TooLarge
            } else {
                RefuseReason::Invalid
            };
            Err(Refusal::new(reason, e.status(), e.body_text()))
        }
    };
    match result {
        Ok(()) => Ok(StatusCode::NO_CONTENT),
        Err(r) => {
            if let Some(m) = &ctx.metrics {
                m.increment_heatmap_batches_refused(r.reason.as_str());
            }
            Err((r.status, r.message))
        }
    }
}

async fn store_clicks(
    ctx: &HeatmapCtx,
    client: &ClientRequest,
    body: &[u8],
    received_at: DateTime<Utc>,
) -> Result<(), Refusal> {
    let batch: ClickBatch = serde_json::from_slice(body).map_err(|_| Refusal::invalid("invalid click batch"))?;
    if batch.clicks.len() > MAX_CLICKS_PER_BATCH {
        return Err(Refusal::new(RefuseReason::TooLarge, StatusCode::PAYLOAD_TOO_LARGE, "too many clicks"));
    }
    validate_batch(&batch)?;

    if ctx.processor.check_header_request(
        "heatmap",
        &batch.site_id,
        &client.ip,
        &client.user_agent,
        &client.sec_ch_ua,
        &batch.url,
        &batch.screen_resolution,
        client.prefetch,
    ) {
        return Err(Refusal::new(RefuseReason::Blocked, StatusCode::FORBIDDEN, "rejected"));
    }

    validate_site_policies(&ctx.site_cfg_cache, &batch.site_id, &batch.url, &client.ip)
        .await
        .map_err(|e| Refusal::new(RefuseReason::Blocked, StatusCode::FORBIDDEN, e.to_string()))?;

    if bot_detection::velocity::check_heatmap(&batch.site_id, &client.ip) {
        warn!(site_id = %batch.site_id, "rejected heatmap batch: velocity limit exceeded");
        return Err(Refusal::new(RefuseReason::RateLimited, StatusCode::TOO_MANY_REQUESTS, "rate limited"));
    }
    bot_detection::velocity::record_heatmap(&batch.site_id, &client.ip);

    // Same identity inputs as a pageview, so the fingerprint matches the pageview's
    let parsed = ua_parser::parse_user_agent(&client.user_agent);
    let device_type = detect_device_type_from_resolution_with_fallback(&batch.screen_resolution);
    let (domain, path) = extract_domain_and_path_from_url(&batch.url);
    let root_domain = domain.as_deref().and_then(extract_root_domain);
    let attrs = VisitorAttrs {
        ip: &client.ip,
        device_type: Some(&device_type),
        browser: Some(parsed.browser.as_str()),
        browser_version: parsed.browser_version.as_deref(),
        os: Some(parsed.os.as_str()),
        root_domain: root_domain.as_deref(),
    };
    let Some(identity) = visitor::identify_existing(&batch.site_id, &attrs) else {
        debug!(site_id = %batch.site_id, "dropping heatmap batch without an existing session");
        if let Some(m) = &ctx.metrics {
            m.increment_heatmap_clicks_dropped("no_session", batch.clicks.len() as u64);
        }
        return Ok(());
    };

    let device = device_from_viewport(batch.viewport_width);
    let mut rows = Vec::with_capacity(batch.clicks.len());
    for click in &batch.clicks {
        if let Err(reason) = validate_click(click, batch.viewport_width, batch.document_height) {
            if let Some(m) = &ctx.metrics {
                m.increment_heatmap_clicks_dropped(reason.as_str(), 1);
            }
            continue;
        }
        rows.push(HeatmapClickRow {
            site_id: batch.site_id.clone(),
            session_id: identity.session_id,
            visitor_id: identity.fingerprint,
            url: path.clone(),
            device: device.to_string(),
            viewport_width: batch.viewport_width as u16,
            document_height: batch.document_height,
            page_x: click.page_x.round() as u32,
            page_y: click.page_y.round() as u32,
            selector: click.selector.clone(),
            offset_x: click.offset_x as f32,
            offset_y: click.offset_y as f32,
            is_fixed: click.fixed,
            timestamp: click_timestamp(received_at, click.ms_ago),
        });
    }

    enqueue(ctx, rows);
    Ok(())
}

fn enqueue(ctx: &HeatmapCtx, rows: Vec<HeatmapClickRow>) {
    let total = rows.len() as u64;
    let mut accepted = 0u64;
    let mut failure = None;
    for row in rows {
        match ctx.click_tx.try_send(row) {
            Ok(()) => accepted += 1,
            Err(TrySendError::Full(_)) => {
                failure = Some("channel_full");
                break;
            }
            Err(TrySendError::Closed(_)) => {
                failure = Some("channel_closed");
                break;
            }
        }
    }
    if let Some(m) = &ctx.metrics {
        m.increment_heatmap_clicks_accepted(accepted);
        if let Some(reason) = failure {
            m.increment_events_dropped(reason, "analytics.heatmap_clicks", total - accepted);
        }
    }
    if let Some(reason) = failure {
        warn!(reason, dropped = total - accepted, "Heatmap channel unavailable, dropping clicks");
    }
}

fn validate_batch(batch: &ClickBatch) -> Result<(), Refusal> {
    if batch.site_id.is_empty() || batch.site_id.len() > MAX_SITE_ID_CHARS || has_control_chars(&batch.site_id) {
        return Err(Refusal::invalid("invalid site_id"));
    }
    if batch.url.is_empty()
        || batch.url.len() > MAX_URL_CHARS
        || has_control_chars(&batch.url)
        || Url::parse(&batch.url).is_err()
    {
        return Err(Refusal::invalid("invalid url"));
    }
    if batch.screen_resolution.len() > MAX_SCREEN_RESOLUTION_CHARS || has_control_chars(&batch.screen_resolution) {
        return Err(Refusal::invalid("invalid screen_resolution"));
    }
    if !(1..=MAX_VIEWPORT_WIDTH).contains(&batch.viewport_width) {
        return Err(Refusal::invalid("invalid viewport_width"));
    }
    if !(1..=MAX_DOCUMENT_HEIGHT).contains(&batch.document_height) {
        return Err(Refusal::invalid("invalid document_height"));
    }
    Ok(())
}

/// A bad click is dropped on its own; the rest of its batch is still stored
fn validate_click(click: &RawClick, viewport_width: u32, document_height: u32) -> Result<(), DropReason> {
    if click.selector.is_empty()
        || click.selector.chars().count() > MAX_SELECTOR_CHARS
        || has_control_chars(&click.selector)
    {
        return Err(DropReason::Selector);
    }
    let within = |value: f64, max: u32| value.is_finite() && (0.0..=f64::from(max)).contains(&value);
    if !within(click.page_x, viewport_width) || !within(click.page_y, document_height) {
        return Err(DropReason::Position);
    }
    let fraction = |value: f64| value.is_finite() && (0.0..=1.0).contains(&value);
    if !fraction(click.offset_x) || !fraction(click.offset_y) {
        return Err(DropReason::Offset);
    }
    Ok(())
}

/// The `device.rs` buckets with laptop and desktop merged, applied to the viewport,
/// since the page layout follows the viewport rather than the screen
fn device_from_viewport(viewport_width: u32) -> &'static str {
    match viewport_width {
        0..=575 => "phone",
        576..=991 => "tablet",
        _ => "desktop",
    }
}

fn click_timestamp(received_at: DateTime<Utc>, ms_ago: f64) -> DateTime<Utc> {
    let ms_ago = if ms_ago.is_finite() { ms_ago.clamp(0.0, MAX_CLICK_AGE_MS) } else { 0.0 };
    received_at - chrono::Duration::milliseconds(ms_ago as i64)
}

fn has_control_chars(input: &str) -> bool {
    input.chars().any(char::is_control)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn click(page_x: f64, page_y: f64, selector: &str, offset: (f64, f64)) -> RawClick {
        RawClick {
            page_x,
            page_y,
            selector: selector.to_string(),
            offset_x: offset.0,
            offset_y: offset.1,
            fixed: false,
            ms_ago: 0.0,
        }
    }

    fn batch(viewport_width: u32, document_height: u32) -> ClickBatch {
        ClickBatch {
            site_id: "site".to_string(),
            url: "https://example.com/pricing".to_string(),
            screen_resolution: "1920x1080".to_string(),
            viewport_width,
            document_height,
            clicks: Vec::new(),
        }
    }

    #[test]
    fn device_buckets_follow_the_viewport_width() {
        assert_eq!(device_from_viewport(1), "phone");
        assert_eq!(device_from_viewport(575), "phone");
        assert_eq!(device_from_viewport(576), "tablet");
        assert_eq!(device_from_viewport(991), "tablet");
        assert_eq!(device_from_viewport(992), "desktop");
        assert_eq!(device_from_viewport(2560), "desktop");
    }

    #[test]
    fn clicks_inside_the_page_are_kept() {
        assert_eq!(validate_click(&click(10.0, 20.0, "#buy", (0.5, 0.5)), 1280, 4000), Ok(()));
        assert_eq!(validate_click(&click(0.0, 0.0, "a", (0.0, 0.0)), 1280, 4000), Ok(()));
        assert_eq!(validate_click(&click(1280.0, 4000.0, "a", (1.0, 1.0)), 1280, 4000), Ok(()));
    }

    #[test]
    fn clicks_outside_the_reported_page_are_dropped() {
        assert_eq!(validate_click(&click(1280.5, 20.0, "a", (0.5, 0.5)), 1280, 4000), Err(DropReason::Position));
        assert_eq!(validate_click(&click(10.0, 4001.0, "a", (0.5, 0.5)), 1280, 4000), Err(DropReason::Position));
        assert_eq!(validate_click(&click(-1.0, 20.0, "a", (0.5, 0.5)), 1280, 4000), Err(DropReason::Position));
        assert_eq!(validate_click(&click(f64::NAN, 20.0, "a", (0.5, 0.5)), 1280, 4000), Err(DropReason::Position));
    }

    #[test]
    fn offsets_outside_zero_to_one_are_dropped() {
        assert_eq!(validate_click(&click(1.0, 1.0, "a", (1.01, 0.5)), 1280, 4000), Err(DropReason::Offset));
        assert_eq!(validate_click(&click(1.0, 1.0, "a", (0.5, -0.01)), 1280, 4000), Err(DropReason::Offset));
    }

    #[test]
    fn selectors_are_capped_and_cleaned() {
        let max = "a".repeat(MAX_SELECTOR_CHARS);
        assert_eq!(validate_click(&click(1.0, 1.0, &max, (0.5, 0.5)), 1280, 4000), Ok(()));
        let multibyte = "é".repeat(MAX_SELECTOR_CHARS);
        assert_eq!(validate_click(&click(1.0, 1.0, &multibyte, (0.5, 0.5)), 1280, 4000), Ok(()));
        let long = "a".repeat(MAX_SELECTOR_CHARS + 1);
        assert_eq!(validate_click(&click(1.0, 1.0, &long, (0.5, 0.5)), 1280, 4000), Err(DropReason::Selector));
        assert_eq!(validate_click(&click(1.0, 1.0, "", (0.5, 0.5)), 1280, 4000), Err(DropReason::Selector));
        assert_eq!(validate_click(&click(1.0, 1.0, "a\nb", (0.5, 0.5)), 1280, 4000), Err(DropReason::Selector));
    }

    #[test]
    fn batch_page_size_must_be_sane() {
        assert!(validate_batch(&batch(1280, 4000)).is_ok());
        assert!(validate_batch(&batch(0, 4000)).is_err());
        assert!(validate_batch(&batch(MAX_VIEWPORT_WIDTH + 1, 4000)).is_err());
        assert!(validate_batch(&batch(1280, 0)).is_err());
        assert!(validate_batch(&batch(1280, MAX_DOCUMENT_HEIGHT + 1)).is_err());
    }

    #[test]
    fn batch_url_and_site_must_be_valid() {
        let mut b = batch(1280, 4000);
        b.url = "not a url".to_string();
        assert!(validate_batch(&b).is_err());
        let mut b = batch(1280, 4000);
        b.site_id = "site\u{0}".to_string();
        assert!(validate_batch(&b).is_err());
        let mut b = batch(1280, 4000);
        b.site_id = String::new();
        assert!(validate_batch(&b).is_err());
    }

    #[test]
    fn click_time_is_receive_time_minus_age_capped() {
        let received = DateTime::from_timestamp_millis(1_755_600_000_000).unwrap();
        let ms = chrono::Duration::milliseconds;
        assert_eq!(click_timestamp(received, 1500.0), received - ms(1500));
        assert_eq!(click_timestamp(received, -50.0), received);
        assert_eq!(click_timestamp(received, f64::INFINITY), received);
        assert_eq!(click_timestamp(received, 1e15), received - ms(24 * 60 * 60 * 1000));
    }

    #[test]
    fn batch_contract_parses_from_collector_json() {
        let json = r##"{"site_id":"abc","url":"https://example.com/a?q=1#top","screen_resolution":"1920x1080",
            "viewport_width":1280,"document_height":3000,
            "clicks":[{"page_x":100,"page_y":200.5,"selector":"#buy","offset_x":0.25,"offset_y":0.75,"fixed":true,"ms_ago":1234}]}"##;
        let b: ClickBatch = serde_json::from_str(json).unwrap();
        assert_eq!((b.viewport_width, b.document_height, b.clicks.len()), (1280, 3000, 1));
        let c = &b.clicks[0];
        assert!(c.fixed);
        assert_eq!((c.page_x, c.page_y, c.ms_ago), (100.0, 200.5, 1234.0));
    }
}
