use anyhow::Result;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::sync::mpsc::{self, error::TrySendError};
use tracing::{error, debug, warn};
use crate::analytics::{AnalyticsEvent, VisitorAttrs};
use crate::asn::{AsnInfo, AsnService};
use moka::sync::Cache;
use once_cell::sync::Lazy;
use std::time::Duration;
use crate::geoip::GeoIpService;
use crate::metrics::MetricsCollector;
use crate::visitor;
use crate::bot_detection;
use crate::referrer::{ReferrerInfo, parse_referrer};
use crate::url_utils::{extract_domain_and_path_from_url, extract_root_domain};
use url::Url;
use crate::campaign::{CampaignInfo, parse_campaign_params};
use crate::ua_parser;
use crate::outbound_link::process_outbound_link;
use crate::analytics::detect_device_type_from_resolution_with_fallback;
use crate::error_fingerprint::generate_error_fingerprint;

// Keyed on the full tuple, not a hash: the verdict gates an enforcing 403, so a
// hash collision must not transfer one visitor's verdict to another
static REPLAY_VERDICTS: Lazy<Cache<(String, String, String), bool>> = Lazy::new(|| {
    Cache::builder()
        .time_to_live(Duration::from_secs(600))
        .max_capacity(100_000)
        .build()
});

/// A bot-detection hit (enforced or shadow), recorded to `analytics.bot_events`.
#[derive(Debug, Clone)]
pub struct BotEvent {
    pub site_id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub domain: Option<String>,
    pub url: String,
    pub referrer: String,
    pub user_agent: String,
    pub screen_resolution: String,
    pub event_name: String,
    pub bot_reasons: Vec<String>,
    pub asn: u32,
    pub asn_org: String,
}

#[derive(Debug, Clone)]
pub struct ProcessedEvent {
    /// Base original event data sent from client through analytics.js script
    pub event: AnalyticsEvent,
    /// Sessionization - new sessions are created if the user has not generated any events in over 30 minutes
    pub session_id: u64,
    pub session_created_at: chrono::DateTime<chrono::Utc>,
    /// Contains the domain of the URL (e.g. "example.com" or "subdomain.example.com")
    pub domain: Option<String>,
    /// Contains only the path of the URL (e.g. "/path/to/page" or "/")
    pub url: String,
    /// Geolocation data - Planning to use ip-api.com or maxmind to get this data
    pub country_code: Option<String>,
    /// Subdivision/region code in ISO 3166-2 format (e.g. "US-CA")
    pub subdivision_code: Option<String>,
    /// City name from GeoIP lookup (English)
    pub city: Option<String>,
    /// Browser information - Parsed from user_agent string
    pub browser: Option<String>,
    pub browser_version: Option<String>,
    /// Operating system - Parsed from user_agent string
    pub os: Option<String>,
    pub os_version: Option<String>,
    /// Device type (mobile, desktop, tablet) - Parsed from user_agent string
    pub device_type: Option<String>,
    pub site_id: String,
    pub visitor_fingerprint: u64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Parsed referrer information
    pub referrer_info: ReferrerInfo,
    /// Parsed campaign parameters
    pub campaign_info: CampaignInfo,
    pub user_agent: String,
    /// Custom event handling
    pub event_type: String,
    pub custom_event_name: String,
    pub custom_event_json: String,
    /// Outbound link tracking - stored when user clicks on a link that directs them to an external page
    pub outbound_link_url: String,
    pub cwv_cls: Option<f32>,
    pub cwv_lcp: Option<f32>,
    pub cwv_inp: Option<f32>,
    pub cwv_fcp: Option<f32>,
    pub cwv_ttfb: Option<f32>,
    pub scroll_depth_percentage: Option<f32>,
    pub scroll_depth_pixels: Option<f32>,
    /// JS error tracking
    pub error_exceptions: String,
    pub error_type: String,
    pub error_message: String,
    pub error_fingerprint: String,
    pub global_properties_keys: Vec<String>,
    pub global_properties_values: Vec<String>,
    /// Duration for engagement events
    pub page_duration_seconds: u32,
    /// Autonomous system of the client IP (0 / empty when unknown)
    pub asn: u32,
    pub asn_org: String,
}

/// Logs one in every 1000 drops so a sustained overflow cannot flood the log;
/// the dropped_total metric carries the exact count.
static DROP_LOG_SAMPLE: AtomicU64 = AtomicU64::new(0);

/// Event processor that handles real-time processing
pub struct EventProcessor {
    event_tx: mpsc::Sender<ProcessedEvent>,
    bot_tx: mpsc::Sender<BotEvent>,
    geoip_service: GeoIpService,
    /// None when ASN lookup is disabled; detections then see asn 0 / empty org
    asn_service: Option<AsnService>,
    metrics: Option<Arc<MetricsCollector>>,
    honor_client_timestamps: bool,
    /// When false, detections update metrics but are not persisted to bot_events
    log_bot_events: bool,
}

impl EventProcessor {
    /// `event_tx`/`bot_tx` are the ingest channels consumed by the ClickHouse inserter tasks.
    pub fn new(
        geoip_service: GeoIpService,
        asn_service: Option<AsnService>,
        event_tx: mpsc::Sender<ProcessedEvent>,
        bot_tx: mpsc::Sender<BotEvent>,
        metrics: Option<Arc<MetricsCollector>>,
        honor_client_timestamps: bool,
        log_bot_events: bool,
    ) -> Self {
        Self { event_tx, bot_tx, geoip_service, asn_service, metrics, honor_client_timestamps, log_bot_events }
    }

    fn asn_lookup(&self, ip_address: &str) -> AsnInfo {
        self.asn_service
            .as_ref()
            .map(|service| service.lookup(ip_address))
            .unwrap_or_default()
    }

    fn record_detection(
        &self,
        detection: &bot_detection::Detection,
        input: &bot_detection::DetectionInput,
        site_id: &str,
        domain: Option<&str>,
        path: &str,
        event_name: &str,
        asn_org: &str,
    ) {
        if detection.is_empty() {
            return;
        }
        let bot_reasons = detection.tagged_reasons();
        debug!("Bot signals ({:?}), recording to bot_events: {}", bot_reasons, input.user_agent);
        if let Some(metrics) = &self.metrics {
            for reason in &bot_reasons {
                metrics.increment_bot_event_detected(reason);
            }
        }
        if !self.log_bot_events {
            return;
        }
        let bot_event = BotEvent {
            site_id: site_id.to_string(),
            timestamp: chrono::Utc::now(),
            domain: domain.map(str::to_string),
            url: path.to_string(),
            referrer: input.referrer.to_string(),
            user_agent: input.user_agent.to_string(),
            screen_resolution: input.screen_resolution.to_string(),
            event_name: event_name.to_string(),
            bot_reasons,
            asn: input.asn,
            asn_org: asn_org.to_string(),
        };
        // try_send: recording bot traffic must never backpressure the human event path
        if self.bot_tx.try_send(bot_event).is_err() {
            if let Some(metrics) = &self.metrics {
                metrics.increment_events_dropped("bot_channel_full", "analytics.bot_events", 1);
            }
            debug!("Bot event channel full, dropping bot event record");
        }
    }

    /// Bot gate for the replay endpoints; only header-derived signals are available
    /// there. The verdict is cached because the segment upload fires once per chunk
    /// on inputs that are constant for the session.
    pub fn check_replay_request(
        &self,
        site_id: &str,
        ip_address: &str,
        user_agent: &str,
        sec_ch_ua: &str,
        url: &str,
        screen_resolution: &str,
        prefetch: bool,
    ) -> bool {
        let key = (site_id.to_string(), ip_address.to_string(), user_agent.to_string());
        if let Some(reject) = REPLAY_VERDICTS.get(&key) {
            return reject;
        }

        let asn_info = self.asn_lookup(ip_address);
        let input = bot_detection::DetectionInput {
            user_agent,
            header_user_agent: user_agent,
            screen_resolution,
            asn: asn_info.asn,
            prefetch,
            sec_ch_ua,
            ..Default::default()
        };
        let detection = bot_detection::detect(&input);
        let (domain, path) = extract_domain_and_path_from_url(url);
        self.record_detection(&detection, &input, site_id, domain.as_deref(), &path, "replay", &asn_info.org);

        let reject = detection.should_reject();
        REPLAY_VERDICTS.insert(key, reject);
        reject
    }

    pub async fn process_event(&self, event: AnalyticsEvent) -> Result<()> {
        let site_id = event.raw.site_id.clone();
        let timestamp = if self.honor_client_timestamps {
            event.raw.timestamp
                .and_then(|ts| chrono::DateTime::from_timestamp(ts as i64, 0))
                .unwrap_or_else(chrono::Utc::now)
        } else {
            chrono::Utc::now()
        };
        let raw_url = event.raw.url.clone();
        let referrer = event.raw.referrer.clone();
        let user_agent = event.raw.user_agent.clone();

        let asn_info = self.asn_lookup(&event.ip_address);
        let velocity_exceeded = bot_detection::velocity::check(&site_id, &event.ip_address);
        let (domain, path) = extract_domain_and_path_from_url(&raw_url);
        debug!("Extracted domain '{:?}' and path '{}' from URL '{}'", domain, path, raw_url);

        // Bot Detection early to avoid processing bot traffic
        let input = bot_detection::DetectionInput {
            user_agent: &user_agent,
            header_user_agent: &event.header_user_agent,
            screen_resolution: &event.raw.screen_resolution,
            referrer: referrer.as_deref().unwrap_or_default(),
            automation: event.raw.automation,
            asn: asn_info.asn,
            prefetch: event.prefetch,
            velocity_exceeded,
            sec_ch_ua: &event.sec_ch_ua,
        };
        let detection = bot_detection::detect(&input);
        self.record_detection(&detection, &input, &site_id, domain.as_deref(), &path, &event.raw.event_name, &asn_info.org);
        if detection.should_reject() {
            return Ok(());
        }
        // Counted only for accepted events, so a blocked bot flood cannot poison
        // the velocity window shared with humans behind the same IP
        bot_detection::velocity::record(&site_id, &event.ip_address);

        let mut processed = ProcessedEvent {
            event: event.clone(),
            event_type: String::new(),
            session_id: 0,
            session_created_at: chrono::Utc::now(),
            country_code: None,
            subdivision_code: None,
            city: None,
            browser: None,
            browser_version: None,
            os: None,
            os_version: None,
            device_type: None,
            site_id: site_id.clone(),
            visitor_fingerprint: 0u64,
            timestamp: timestamp.clone(),
            domain,
            url: path,
            referrer_info: ReferrerInfo::default(),
            user_agent: user_agent.clone(),
            campaign_info: CampaignInfo::default(),
            custom_event_name: String::new(),
            custom_event_json: String::new(),
            outbound_link_url: String::new(),
            cwv_cls: None,
            cwv_lcp: None,
            cwv_inp: None,
            cwv_fcp: None,
            cwv_ttfb: None,
            scroll_depth_percentage: None,
            scroll_depth_pixels: None,
            error_exceptions: String::new(),
            error_type: String::new(),
            error_message: String::new(),
            error_fingerprint: String::new(),
            global_properties_keys: Vec::new(),
            global_properties_values: Vec::new(),
            page_duration_seconds: 0,
            asn: asn_info.asn,
            asn_org: asn_info.org,
        };

        // Handle event types
        if let Err(e) = self.handle_event_types(&mut processed).await {
            error!("Failed to handle event type: {}", e);
        }

        // Parse referrer information
        processed.referrer_info = parse_referrer(referrer.as_deref(), Some(&raw_url));
        debug!("referrer_info: {:?}", processed.referrer_info);
        
        // Parse campaign parameters from URL
        processed.campaign_info = parse_campaign_params(&raw_url);
        debug!("campaign_info: {:?}", processed.campaign_info);

        if let Err(e) = self.get_geolocation(&mut processed).await {
            error!("Failed to get geolocation: {}", e);
        }

        if let Err(e) = self.detect_device_type_from_resolution(&mut processed).await {
            error!("Failed to detect device type from resolution: {}", e);
        }
        
        if let Err(e) = self.parse_user_agent(&mut processed).await {
            error!("Failed to parse user agent: {}", e);
        }

        let root_domain = processed.domain.as_ref().and_then(|d| extract_root_domain(d));

        let identity = {
            let attrs = VisitorAttrs {
                ip: &processed.event.ip_address,
                device_type: processed.device_type.as_deref(),
                browser: processed.browser.as_deref(),
                browser_version: processed.browser_version.as_deref(),
                os: processed.os.as_deref(),
                root_domain: root_domain.as_deref(),
            };
            visitor::identify(&site_id, &attrs, timestamp)
        };

        processed.visitor_fingerprint = identity.fingerprint;
        processed.session_id = identity.session_id;
        processed.session_created_at = identity.session_created_at;

        debug!("Site ID: {}", processed.site_id);
        debug!("Session ID: {}", processed.session_id);

        // try_send, not send: ingestion stays responsive if the buffer fills,
        // at the cost of dropping the newest events (counted, never silent).
        if let Err(e) = self.event_tx.try_send(processed) {
            let reason = match e {
                TrySendError::Full(_) => "channel_full",
                TrySendError::Closed(_) => "channel_closed",
            };
            if let Some(metrics) = &self.metrics {
                metrics.increment_events_dropped(reason, "analytics.events", 1);
            }
            let dropped = DROP_LOG_SAMPLE.fetch_add(1, Ordering::Relaxed);
            if dropped % 1000 == 0 {
                warn!(reason, sampled_drop_number = dropped + 1, "Ingest channel unavailable, dropping event");
            }
        }

        debug!("Processed event finished!");
        Ok(())
    }

    /// Extract domain and path from a URL string.
    /// Handle different event types
    async fn handle_event_types(&self, processed: &mut ProcessedEvent) -> Result<()> {
        let event_name = processed.event.raw.event_name.clone();
        if processed.event.raw.is_custom_event {
            processed.event_type = "custom".to_string();
            processed.custom_event_name = event_name;
            processed.custom_event_json = processed.event.raw.properties.clone();
        } else if event_name == "outbound_link" {
            processed.event_type = "outbound_link".to_string();
            // Process and clean outbound link URL
            if let Some(ref outbound_url_str) = processed.event.raw.outbound_link_url {
                if let Some(ref outbound_url) = Url::parse(&outbound_url_str).ok() {
                    let outbound_info = process_outbound_link(outbound_url);
                    processed.outbound_link_url = outbound_info.url;
                }
            }
        } else if event_name == "cwv" {
            processed.event_type = "cwv".to_string();
            processed.cwv_cls = processed.event.raw.cwv_cls;
            processed.cwv_lcp = processed.event.raw.cwv_lcp;
            processed.cwv_inp = processed.event.raw.cwv_inp;
            processed.cwv_fcp = processed.event.raw.cwv_fcp;
            processed.cwv_ttfb = processed.event.raw.cwv_ttfb;
        } else if event_name == "scroll_depth" {
            // Legacy event from old cached trackers. Translate to engagement at ingest
            // so queries only need to read 'engagement' rows. page_duration_seconds = 0
            // is the canonical sentinel for "no usable duration"; the
            // `page_duration_seconds > 0` query gate excludes these from time-on-page
            // averages while still letting their scroll values contribute.
            processed.event_type = "engagement".to_string();
            processed.page_duration_seconds = 0;
            processed.scroll_depth_percentage = processed.event.raw.scroll_depth_percentage;
            processed.scroll_depth_pixels = processed.event.raw.scroll_depth_pixels;
        } else if event_name == "client_error" {
            processed.event_type = "client_error".to_string();
            self.process_client_error(processed);
        } else if event_name == "engagement" {
            processed.event_type = "engagement".to_string();
            processed.page_duration_seconds = processed.event.raw.page_duration_seconds.unwrap_or(0);
            processed.scroll_depth_percentage = processed.event.raw.scroll_depth_percentage;
            processed.scroll_depth_pixels = processed.event.raw.scroll_depth_pixels;
        } else {
            processed.event_type = event_name;
        }

        if let Some(ref gp) = processed.event.raw.global_properties {
            let (keys, values) = decompose_global_properties(gp);
            processed.global_properties_keys = keys;
            processed.global_properties_values = values;
        }

        Ok(())
    }

    async fn get_geolocation(&self, processed: &mut ProcessedEvent) -> Result<()> {
        let geo = self.geoip_service.lookup(&processed.event.ip_address);

        processed.country_code = geo.country_code;
        processed.subdivision_code = geo.subdivision_code;
        processed.city = geo.city;

        if processed.country_code.is_some() {
            debug!("Geolocation successful: country={:?}, subdivision={:?}, city={:?}",
                processed.country_code, processed.subdivision_code, processed.city);
        } else {
            debug!("Geolocation lookup returned no country code.");
        }
        Ok(())
    }

    async fn parse_user_agent(&self, processed: &mut ProcessedEvent) -> Result<()> {
        let parsed = ua_parser::parse_user_agent(&processed.user_agent);
        
        processed.browser = Some(parsed.browser);
        processed.browser_version = parsed.browser_version;
        processed.os = Some(parsed.os);
        processed.os_version = parsed.os_version;
        
        debug!(
            "User agent parsed: browser={:?}, version={:?}, os={:?}, os_version={:?}, device_type={:?}",
            processed.browser, processed.browser_version, processed.os, processed.os_version, processed.device_type
        );
        
        Ok(())
    }
    
    fn process_client_error(&self, processed: &mut ProcessedEvent) {
        let list = processed.event.raw.error_exceptions.clone().unwrap_or_default();
        if let Ok(arr) = serde_json::from_str::<serde_json::Value>(&list) {
            processed.error_type = arr[0]["type"].as_str().unwrap_or("").to_string();
            processed.error_message = arr[0]["value"].as_str().unwrap_or("").to_string();
        }
        processed.error_fingerprint = generate_error_fingerprint(
            &processed.error_type,
            &list,
        );
        processed.error_exceptions = list;
    }

    async fn detect_device_type_from_resolution(&self, processed: &mut ProcessedEvent) -> Result<()> {
        let device_type = detect_device_type_from_resolution_with_fallback(&processed.event.raw.screen_resolution);
        processed.device_type = Some(device_type);
        Ok(())
    }
}

fn decompose_global_properties(value: &serde_json::Value) -> (Vec<String>, Vec<String>) {
    let Some(obj) = value.as_object() else {
        return (Vec::new(), Vec::new());
    };
    let mut keys = Vec::with_capacity(obj.len());
    let mut values = Vec::with_capacity(obj.len());
    for (key, val) in obj {
        let value_str = match val {
            serde_json::Value::String(s) => s.clone(),
            serde_json::Value::Number(n) => n.to_string(),
            serde_json::Value::Bool(b) => b.to_string(),
            _ => continue,
        };
        keys.push(key.clone());
        values.push(value_str);
    }
    (keys, values)
}