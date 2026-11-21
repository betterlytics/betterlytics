//! Heatmap click ingestion: the collector sends one batch of clicks per page view,
//! stored as one `analytics.heatmap_clicks` row per click.

pub mod capture;

use std::sync::Arc;
use std::sync::atomic::{AtomicU32, AtomicU64, Ordering};

use axum::{
    extract::{State, rejection::BytesRejection},
    http::StatusCode,
};
use bytes::Bytes;
use chrono::{DateTime, Utc};
use moka::sync::Cache;
use once_cell::sync::Lazy;
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
use crate::session::SESSION_EXPIRY;
use crate::site_config::SiteConfigCache;
use crate::ua_parser;
use crate::url_utils::{extract_domain_and_path_from_url, extract_root_domain};
use crate::validation::validate_site_policies;
use crate::visitor;

pub const MAX_BATCH_BYTES: usize = 64 * 1024;
const MAX_CLICKS_PER_BATCH: usize = 200;
const MAX_SELECTOR_CHARS: usize = 500;
const MAX_SITE_ID_CHARS: usize = 100;
const MAX_URL_CHARS: usize = 2048;
const MAX_SCREEN_RESOLUTION_CHARS: usize = 32;
pub(crate) const MAX_VIEWPORT_WIDTH: u32 = 16_384;
pub(crate) const MAX_DOCUMENT_HEIGHT: u32 = 1_000_000;
const MAX_CLICK_AGE_MS: f64 = 24.0 * 60.0 * 60.0 * 1000.0;
/// A heatmap is an aggregate, so one session's clicks past this add little, and without it a
/// script could store unbilled rows for as long as it keeps one pageview's session alive
const MAX_CLICKS_PER_SESSION: u32 = 300;

/// Stored clicks per session id, forgotten after the session's last heatmap batch plus the
/// session expiry
static SESSION_CLICKS: Lazy<Cache<u64, Arc<AtomicU32>>> =
    Lazy::new(|| Cache::builder().time_to_idle(SESSION_EXPIRY).max_capacity(1_000_000).build());

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
    /// Layout width without the scrollbar, which click positions are measured against
    viewport_width: u32,
    /// Window width with the scrollbar, which the device is bucketed by
    #[serde(default)]
    window_width: Option<u32>,
    /// Wider than the viewport on horizontally scrolled pages, where page_x runs past it
    #[serde(default)]
    document_width: Option<u32>,
    document_height: u32,
    clicks: Vec<RawClick>,
}

impl ClickBatch {
    fn page_width(&self) -> u32 {
        self.document_width.unwrap_or(0).max(self.viewport_width)
    }
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

    validate_site_policies(&ctx.site_cfg_cache, &batch.site_id, &batch.url, &client.ip)
        .await
        .map_err(|e| Refusal::new(RefuseReason::Blocked, StatusCode::FORBIDDEN, e.to_string()))?;

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

    if bot_detection::velocity::check_heatmap(&batch.site_id, &client.ip) {
        warn!(site_id = %batch.site_id, "rejected heatmap batch: velocity limit exceeded");
        return Err(Refusal::new(RefuseReason::RateLimited, StatusCode::TOO_MANY_REQUESTS, "rate limited"));
    }
    bot_detection::velocity::record_heatmap(&batch.site_id, &client.ip, batch.clicks.len());

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

    let device = device_from_viewport(bucket_width(batch.viewport_width, batch.window_width));
    let page_width = batch.page_width();
    let mut rows = Vec::with_capacity(batch.clicks.len());
    for click in &batch.clicks {
        if let Err(reason) = validate_click(click, page_width, batch.document_height) {
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

    let allowed = reserve_session_clicks(identity.session_id, rows.len());
    if allowed < rows.len() {
        if let Some(m) = &ctx.metrics {
            m.increment_heatmap_clicks_dropped("session_cap", (rows.len() - allowed) as u64);
        }
        rows.truncate(allowed);
    }

    enqueue(ctx, rows);
    Ok(())
}

/// Logs one in every 1000 dropped batches so a sustained overflow cannot flood the log;
/// the dropped_total metric carries the exact click count.
static DROP_LOG_SAMPLE: AtomicU64 = AtomicU64::new(0);

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
        let batch_drops = DROP_LOG_SAMPLE.fetch_add(1, Ordering::Relaxed);
        if batch_drops.is_multiple_of(1000) {
            warn!(
                reason,
                dropped = total - accepted,
                sampled_drop_number = batch_drops + 1,
                "Heatmap channel unavailable, dropping clicks"
            );
        }
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
    if batch.document_width.is_some_and(|width| !(1..=MAX_VIEWPORT_WIDTH).contains(&width)) {
        return Err(Refusal::invalid("invalid document_width"));
    }
    if !(1..=MAX_DOCUMENT_HEIGHT).contains(&batch.document_height) {
        return Err(Refusal::invalid("invalid document_height"));
    }
    Ok(())
}

/// A bad click is dropped on its own; the rest of its batch is still stored
fn validate_click(click: &RawClick, page_width: u32, document_height: u32) -> Result<(), DropReason> {
    if click.selector.is_empty()
        || click.selector.chars().count() > MAX_SELECTOR_CHARS
        || has_control_chars(&click.selector)
    {
        return Err(DropReason::Selector);
    }
    let within = |value: f64, max: u32| value.is_finite() && (0.0..=f64::from(max)).contains(&value);
    if !within(click.page_x, page_width) || !within(click.page_y, document_height) {
        return Err(DropReason::Position);
    }
    let fraction = |value: f64| value.is_finite() && (0.0..=1.0).contains(&value);
    if !fraction(click.offset_x) || !fraction(click.offset_y) {
        return Err(DropReason::Offset);
    }
    Ok(())
}

fn reserve_session_clicks(session_id: u64, wanted: usize) -> usize {
    let wanted = u32::try_from(wanted).unwrap_or(u32::MAX);
    let used = SESSION_CLICKS.get_with(session_id, || Arc::new(AtomicU32::new(0)));
    let mut granted = 0;
    let _ = used.fetch_update(Ordering::Relaxed, Ordering::Relaxed, |stored| {
        granted = MAX_CLICKS_PER_SESSION.saturating_sub(stored).min(wanted);
        (granted > 0).then_some(stored + granted)
    });
    granted as usize
}

/// The width devices are bucketed by. CSS breakpoints count the scrollbar, so it is the window
/// width when the script sent one (never below the layout width), else the layout width that
/// older scripts send.
pub(crate) fn bucket_width(viewport_width: u32, window_width: Option<u32>) -> u32 {
    window_width
        .filter(|w| (viewport_width..=MAX_VIEWPORT_WIDTH).contains(w))
        .unwrap_or(viewport_width)
}

/// The `device.rs` buckets with laptop and desktop merged, applied to the viewport,
/// since the page layout follows the viewport rather than the screen
pub(crate) fn device_from_viewport(viewport_width: u32) -> &'static str {
    match viewport_width {
        0..=575 => "mobile",
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
    use crate::analytics::{AnalyticsEvent, RawTrackingEvent};
    use crate::geoip::GeoIpService;
    use crate::postgres::PostgresError;
    use crate::processing::{BotEvent, ProcessedEvent};
    use crate::site_config::repository::SiteConfigRecord;
    use crate::site_config::{RefreshConfig, SiteConfigDataSource};
    use serde_json::json;
    use tokio::sync::mpsc;

    const SITE: &str = "heatmap-handler-site";
    const UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
    const CH_UA: &str = r#""Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141""#;

    struct OneSite;

    #[async_trait::async_trait]
    impl SiteConfigDataSource for OneSite {
        async fn fetch_all_configs(&self) -> Result<Vec<SiteConfigRecord>, PostgresError> {
            Ok(vec![SiteConfigRecord {
                site_id: SITE.to_string(),
                domain: "example.com".to_string(),
                blacklisted_ips: Vec::new(),
                enforce_domain: true,
                updated_at: Utc::now(),
            }])
        }

        async fn fetch_configs_updated_since(&self, _: DateTime<Utc>) -> Result<Vec<SiteConfigRecord>, PostgresError> {
            Ok(Vec::new())
        }
    }

    struct Harness {
        ctx: HeatmapCtx,
        events: mpsc::Receiver<ProcessedEvent>,
        clicks: mpsc::Receiver<HeatmapClickRow>,
        _bots: mpsc::Receiver<BotEvent>,
    }

    impl Harness {
        async fn new() -> Self {
            ua_parser::initialize(
                &std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("assets/user_agent_headers/regexes.yaml"),
            );
            crate::salt::init_for_tests();
            let (event_tx, events) = mpsc::channel(16);
            let (bot_tx, bots) = mpsc::channel(16);
            let (click_tx, clicks) = mpsc::channel(1024);
            let processor = EventProcessor::new(GeoIpService::disabled(), None, event_tx, bot_tx, None, false, false);
            let site_cfg_cache = SiteConfigCache::initialize(Arc::new(OneSite), RefreshConfig::default(), None)
                .await
                .unwrap();
            let ctx = HeatmapCtx { processor: Arc::new(processor), metrics: None, site_cfg_cache, click_tx };
            Self { ctx, events, clicks, _bots: bots }
        }

        /// Sends an event through the same processing as `/event` and returns it
        async fn event(&mut self, ip: &str, event_name: &str) -> ProcessedEvent {
            let raw: RawTrackingEvent = serde_json::from_value(json!({
                "site_id": SITE, "event_name": event_name, "is_custom_event": event_name != "pageview",
                "properties": "{}", "url": "https://example.com/pricing", "referrer": null,
                "user_agent": UA, "screen_resolution": "1920x1080",
            }))
            .unwrap();
            let event = AnalyticsEvent::new(raw, ip.to_string(), UA.to_string(), CH_UA.to_string(), false);
            self.ctx.processor.process_event(event).await.unwrap();
            self.events.try_recv().expect("event was accepted")
        }

        async fn send(&self, ip: &str, user_agent: &str, sec_ch_ua: &str, body: &[u8]) -> Result<(), StatusCode> {
            let client = ClientRequest {
                ip: ip.to_string(),
                user_agent: user_agent.to_string(),
                sec_ch_ua: sec_ch_ua.to_string(),
                prefetch: false,
            };
            store_clicks(&self.ctx, &client, body, Utc::now()).await.map_err(|r| r.status)
        }

        async fn send_clicks(&self, ip: &str, clicks: usize) -> Result<(), StatusCode> {
            self.send(ip, UA, CH_UA, &batch_body(clicks)).await
        }

        fn stored(&mut self) -> Vec<HeatmapClickRow> {
            std::iter::from_fn(|| self.clicks.try_recv().ok()).collect()
        }
    }

    fn batch_body(clicks: usize) -> Vec<u8> {
        let clicks: Vec<_> = (0..clicks)
            .map(|i| json!({"page_x": 10, "page_y": 20, "selector": format!("#c{i}"), "offset_x": 0.5, "offset_y": 0.5}))
            .collect();
        serde_json::to_vec(&json!({
            "site_id": SITE, "url": "https://example.com/pricing?q=1#top", "screen_resolution": "1920x1080",
            "viewport_width": 1280, "document_height": 3000, "clicks": clicks,
        }))
        .unwrap()
    }

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
            window_width: None,
            document_width: None,
            document_height,
            clicks: Vec::new(),
        }
    }

    #[test]
    fn a_session_stores_at_most_its_click_cap() {
        let session = 0x5e55_1011_cafe_0001;
        assert_eq!(reserve_session_clicks(session, 200), 200);
        assert_eq!(reserve_session_clicks(session, 200), 100);
        assert_eq!(reserve_session_clicks(session, 1), 0);
        assert_eq!(reserve_session_clicks(session + 1, 5), 5);
        assert_eq!(reserve_session_clicks(session + 2, 0), 0);
        assert_eq!(reserve_session_clicks(session + 2, 300), 300);
    }

    #[test]
    fn device_buckets_follow_the_viewport_width() {
        assert_eq!(device_from_viewport(1), "mobile");
        assert_eq!(device_from_viewport(575), "mobile");
        assert_eq!(device_from_viewport(576), "tablet");
        assert_eq!(device_from_viewport(991), "tablet");
        assert_eq!(device_from_viewport(992), "desktop");
        assert_eq!(device_from_viewport(2560), "desktop");
    }

    #[test]
    fn devices_bucket_on_the_window_width_when_sent() {
        assert_eq!(device_from_viewport(bucket_width(983, Some(1000))), "desktop");
        assert_eq!(device_from_viewport(bucket_width(983, None)), "tablet");
        assert_eq!(bucket_width(983, Some(900)), 983);
        assert_eq!(bucket_width(983, Some(MAX_VIEWPORT_WIDTH + 1)), 983);
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
    fn clicks_past_the_viewport_are_kept_on_a_wider_document() {
        let mut b = batch(1280, 4000);
        assert_eq!(b.page_width(), 1280);
        b.document_width = Some(800);
        assert_eq!(b.page_width(), 1280);
        b.document_width = Some(3000);
        assert_eq!(b.page_width(), 3000);
        assert_eq!(validate_click(&click(2900.0, 20.0, "a", (0.5, 0.5)), b.page_width(), 4000), Ok(()));
        assert_eq!(
            validate_click(&click(3000.5, 20.0, "a", (0.5, 0.5)), b.page_width(), 4000),
            Err(DropReason::Position)
        );
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
        for (width, ok) in [(3000, true), (MAX_VIEWPORT_WIDTH, true), (0, false), (MAX_VIEWPORT_WIDTH + 1, false)] {
            let mut b = batch(1280, 4000);
            b.document_width = Some(width);
            assert_eq!(validate_batch(&b).is_ok(), ok, "document_width {width}");
        }
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
        assert_eq!((b.viewport_width, b.document_width, b.document_height, b.clicks.len()), (1280, None, 3000, 1));
        let c = &b.clicks[0];
        assert!(c.fixed);
        assert_eq!((c.page_x, c.page_y, c.ms_ago), (100.0, 200.5, 1234.0));

        let wide = json.replace(r#""document_height""#, r#""document_width":2400,"document_height""#);
        let b: ClickBatch = serde_json::from_str(&wide).unwrap();
        assert_eq!(b.document_width, Some(2400));
    }

    #[tokio::test]
    async fn clicks_are_stored_only_after_an_accepted_pageview() {
        let mut h = Harness::new().await;
        let ip = "81.4.101.10";
        h.event(ip, "signup").await;
        assert_eq!(h.send_clicks(ip, 2).await, Ok(()));
        assert!(h.stored().is_empty());

        let pageview = h.event(ip, "pageview").await;
        assert_eq!(h.send_clicks(ip, 2).await, Ok(()));
        let rows = h.stored();
        assert_eq!(rows.len(), 2);
        for row in &rows {
            assert_eq!((row.session_id, row.visitor_id), (pageview.session_id, pageview.visitor_fingerprint));
            assert_eq!((row.url.as_str(), row.device.as_str()), ("/pricing", "desktop"));
        }
    }

    #[tokio::test]
    async fn the_device_follows_the_window_width_and_positions_the_layout_width() {
        let mut h = Harness::new().await;
        let ip = "81.4.104.10";
        h.event(ip, "pageview").await;
        let body = |extra: &str| {
            String::from_utf8(batch_body(1))
                .unwrap()
                .replace(r#""viewport_width":1280"#, &format!(r#""viewport_width":983{extra}"#))
        };

        assert_eq!(h.send(ip, UA, CH_UA, body(r#","window_width":1000"#).as_bytes()).await, Ok(()));
        assert_eq!(h.send(ip, UA, CH_UA, body("").as_bytes()).await, Ok(()));
        let rows = h.stored();
        let stored: Vec<_> = rows.iter().map(|r| (r.device.as_str(), r.viewport_width)).collect();
        assert_eq!(stored, [("desktop", 983), ("tablet", 983)]);
    }

    #[tokio::test]
    async fn oversized_malformed_foreign_and_bot_batches_are_refused() {
        let mut h = Harness::new().await;
        let ip = "81.4.102.10";
        h.event(ip, "pageview").await;
        assert_eq!(h.send_clicks(ip, MAX_CLICKS_PER_BATCH + 1).await, Err(StatusCode::PAYLOAD_TOO_LARGE));
        assert_eq!(h.send(ip, UA, CH_UA, b"not json").await, Err(StatusCode::BAD_REQUEST));

        let mut foreign: serde_json::Value = serde_json::from_slice(&batch_body(1)).unwrap();
        foreign["url"] = json!("https://elsewhere.com/pricing");
        let foreign = serde_json::to_vec(&foreign).unwrap();
        assert_eq!(h.send(ip, UA, CH_UA, &foreign).await, Err(StatusCode::FORBIDDEN));

        let headless = UA.replace("Chrome/", "HeadlessChrome/");
        assert_eq!(h.send(ip, &headless, CH_UA, &batch_body(1)).await, Err(StatusCode::FORBIDDEN));
        assert!(h.stored().is_empty());
    }

    #[tokio::test]
    async fn a_network_past_its_click_limit_is_refused_and_a_session_keeps_its_cap() {
        let mut h = Harness::new().await;
        let ip = "81.4.103.10";
        h.event(ip, "pageview").await;
        for _ in 0..10 {
            assert_eq!(h.send_clicks(ip, 200).await, Ok(()));
        }
        assert_eq!(h.send_clicks(ip, 1).await, Err(StatusCode::TOO_MANY_REQUESTS));
        assert_eq!(h.stored().len(), MAX_CLICKS_PER_SESSION as usize);

        let other = "81.4.104.10";
        h.event(other, "pageview").await;
        assert_eq!(h.send_clicks(other, 1).await, Ok(()));
        assert_eq!(h.stored().len(), 1);
    }
}
