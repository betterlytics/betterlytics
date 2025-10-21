use anyhow::Result;
use tokio::sync::mpsc;
use tracing::{error, debug};
use crate::analytics::{AnalyticsEvent, generate_fingerprint};
use crate::geoip::GeoIpService;
use crate::session;
use crate::bot_detection;
use crate::referrer::{ReferrerInfo, parse_referrer};
use crate::url_utils::extract_domain_and_path_from_url;
use url::Url;
use crate::campaign::{CampaignInfo, parse_campaign_params};
use crate::ua_parser;
use crate::outbound_link::process_outbound_link;
use crate::analytics::detect_device_type_from_resolution_with_fallback;

#[derive(Debug, Clone)]
pub struct ProcessedEvent {
    /// Base original event data sent from client through analytics.js script
    pub event: AnalyticsEvent,
    /// Sessionization - new sessions are created if the user has not generated any events in over 30 minutes
    pub session_id: String,
    /// Contains the domain of the URL (e.g. "example.com" or "subdomain.example.com")
    pub domain: Option<String>,
    /// Contains only the path of the URL (e.g. "/path/to/page" or "/")
    pub url: String,
    /// Geolocation data - Planning to use ip-api.com or maxmind to get this data
    pub country_code: Option<String>,
    /// Browser information - Parsed from user_agent string
    pub browser: Option<String>,
    pub browser_version: Option<String>,
    /// Operating system - Parsed from user_agent string
    pub os: Option<String>,
    /// Device type (mobile, desktop, tablet) - Parsed from user_agent string
    pub device_type: Option<String>,
    pub site_id: String,
    pub visitor_fingerprint: String,
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
    pub scroll_depth: Option<f32>,
}

/// Event processor that handles real-time processing
pub struct EventProcessor {
    event_tx: mpsc::Sender<ProcessedEvent>,
    geoip_service: GeoIpService,
}

impl EventProcessor {
    pub fn new(geoip_service: GeoIpService) -> (Self, mpsc::Receiver<ProcessedEvent>) {
        let (event_tx, event_rx) = mpsc::channel(100_000);
        (Self { event_tx, geoip_service }, event_rx)
    }

    pub async fn process_event(&self, event: AnalyticsEvent) -> Result<()> {
        let site_id = event.raw.site_id.clone();
        let timestamp = chrono::DateTime::from_timestamp(event.raw.timestamp as i64, 0).unwrap_or_else(|| chrono::Utc::now());
        let raw_url = event.raw.url.clone();
        let referrer = event.raw.referrer.clone();
        let user_agent = event.raw.user_agent.clone();

        // Bot Detection early to avoid processing bot traffic
        if bot_detection::is_bot(&user_agent) {
            debug!("Bot detected, discarding event: {}", user_agent);
            return Ok(());
        }

        let (domain, path) = extract_domain_and_path_from_url(&raw_url);
        debug!("Extracted domain '{:?}' and path '{}' from URL '{}'", domain, path, raw_url);

        let mut processed = ProcessedEvent {
            event: event.clone(),
            event_type: String::new(),
            session_id: String::new(),
            country_code: None,
            browser: None,
            browser_version: None,
            os: None,
            device_type: None,
            site_id: site_id.clone(),
            visitor_fingerprint: String::new(),
            timestamp: timestamp.clone(),
            domain,
            url: path,
            referrer_info: ReferrerInfo::default(),
            user_agent: user_agent.clone(),
            campaign_info: CampaignInfo::default(),
            custom_event_name: String::new(),
            custom_event_json: String::new(),
            scroll_depth: None,
            outbound_link_url: String::new(),
            cwv_cls: None,
            cwv_lcp: None,
            cwv_inp: None,
            cwv_fcp: None,
            cwv_ttfb: None,
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

        processed.visitor_fingerprint = generate_fingerprint(
            &processed.event.ip_address,
            processed.device_type.as_deref(),
            processed.browser.as_deref(),
            processed.browser_version.as_deref(),
            processed.os.as_deref(),
        );

        let session_id_result = session::get_or_create_session_id(
            &site_id, 
            &processed.visitor_fingerprint, 
        );

        match session_id_result {
            Ok(id) => processed.session_id = id,
            Err(e) => {
                error!("Failed to get session ID: {}. Event processing aborted for: {:?}", e, processed.event);
                return Ok(());
            }
        };

        debug!("Site ID: {}", processed.site_id);
        debug!("Session ID: {}", processed.session_id);

        if let Err(e) = self.event_tx.send(processed).await {
            error!("Failed to send processed event: {}", e);
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
        } else if event_name.eq_ignore_ascii_case("cwv") {
            processed.event_type = "cwv".to_string();
            processed.cwv_cls = processed.event.raw.cwv_cls;
            processed.cwv_lcp = processed.event.raw.cwv_lcp;
            processed.cwv_inp = processed.event.raw.cwv_inp;
            processed.cwv_fcp = processed.event.raw.cwv_fcp;
            processed.cwv_ttfb = processed.event.raw.cwv_ttfb;
        } else if event_name == "scroll_depth" {
            processed.event_type = "scroll_depth".to_string();
            processed.scroll_depth = processed.event.raw.scroll_depth;
        } else {
            processed.event_type = event_name;
        }
        
        Ok(())
    }

    /// Get geolocation data for the IP
    async fn get_geolocation(&self, processed: &mut ProcessedEvent) -> Result<()> {
        debug!("Performing Geolocation lookup");
        processed.country_code = self.geoip_service.lookup_country_code(&processed.event.ip_address);
        if processed.country_code.is_some() {
            debug!("Geolocation successful: {:?}", processed.country_code);
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
        
        debug!(
            "User agent parsed: browser={:?}, version={:?}, os={:?}, device_type={:?}",
            processed.browser, processed.browser_version, processed.os, processed.device_type
        );
        
        Ok(())
    }
    
    async fn detect_device_type_from_resolution(&self, processed: &mut ProcessedEvent) -> Result<()> {
        let device_type = detect_device_type_from_resolution_with_fallback(&processed.event.raw.screen_resolution);
        processed.device_type = Some(device_type);
        Ok(())
    } 
}