use anyhow::Result;
use tokio::sync::mpsc;
use tracing::{error, debug};
use crate::analytics::{AnalyticsEvent, generate_fingerprint};
use crate::db::SharedDatabase;
use crate::geoip::GeoIpService;
use crate::session;
use crate::bot_detection;
use crate::referrer::{ReferrerInfo, parse_referrer};
use woothee::parser::Parser;
use once_cell::sync::Lazy;
use url::Url;
use crate::campaign::{CampaignInfo, parse_campaign_params};

static USER_AGENT_PARSER: Lazy<Parser> = Lazy::new(|| Parser::new());

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
    /// Detected bot status
    pub is_bot: bool,
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
}

/// Event processor that handles real-time processing
pub struct EventProcessor {
    db: SharedDatabase,
    event_tx: mpsc::Sender<ProcessedEvent>,
    geoip_service: GeoIpService,
}

impl EventProcessor {
    pub fn new(db: SharedDatabase, geoip_service: GeoIpService) -> (Self, mpsc::Receiver<ProcessedEvent>) {
        let (event_tx, event_rx) = mpsc::channel(100_000);
        (Self { db, event_tx, geoip_service }, event_rx)
    }

    pub async fn process_event(&self, event: AnalyticsEvent) -> Result<()> {
        let site_id = event.raw.site_id.clone();
        let timestamp = chrono::DateTime::from_timestamp(event.raw.timestamp as i64, 0).unwrap_or_else(|| chrono::Utc::now());
        let raw_url = event.raw.url.clone();
        let referrer = event.raw.referrer.clone();
        let user_agent = event.raw.user_agent.clone();

        let (domain, path) = self.extract_domain_and_path_from_url(&raw_url);
        debug!("Extracted domain '{:?}' and path '{}' from URL '{}'", domain, path, raw_url);

        let mut processed = ProcessedEvent {
            event: event.clone(),
            event_type: String::new(),
            session_id: String::new(),
            is_bot: false,
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

        processed.visitor_fingerprint = generate_fingerprint(
            &processed.event.ip_address,
            &processed.event.raw.screen_resolution,
            &processed.event.raw.user_agent,
        );

        if let Err(e) = self.detect_bot(&mut processed).await {
            error!("Failed to detect bot: {}", e);
        }

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

        debug!("Session ID: {}", processed.session_id);

        if let Err(e) = self.detect_device_type_from_resolution(&mut processed).await {
            error!("Failed to detect device type from resolution: {}", e);
        }
        
        if let Err(e) = self.parse_user_agent(&mut processed).await {
            error!("Failed to parse user agent: {}", e);
        }

        if let Err(e) = self.event_tx.send(processed).await {
            error!("Failed to send processed event: {}", e);
        }

        debug!("Processed event finished!");
        Ok(())
    }

    /// Extract domain and path from a URL string.
    fn extract_domain_and_path_from_url(&self, url_str: &str) -> (Option<String>, String) {
        match Url::parse(url_str) {
            Ok(url) => {
                let domain = url.domain().map(|d| d.to_string());
                let path = if url.path().is_empty() {
                    "/".to_string()
                } else {
                    url.path().to_string()
                };
                (domain, path)
            },
            Err(_) => {
                // Since we get URLs from window.location.href, this should never happen
                // But we'll try to handle it gracefully by treating the entire string as a path
                debug!("Failed to parse URL '{}', treating as path-only", url_str);
                if url_str.starts_with('/') {
                    (None, url_str.to_string())
                } else {
                    (None, format!("/{}", url_str))
                }
            }
        }
    }

    /// Handle different event types
    async fn handle_event_types(&self, processed: &mut ProcessedEvent) -> Result<()> {
        let event_name = processed.event.raw.event_name.clone();
        if processed.event.raw.is_custom_event {
            processed.event_type = "custom".to_string();
            processed.custom_event_name = event_name;
            processed.custom_event_json = processed.event.raw.properties.clone();
        } else {
            processed.event_type = event_name;
        }
        Ok(())
    }

    /// Get geolocation data for the IP
    async fn get_geolocation(&self, processed: &mut ProcessedEvent) -> Result<()> {
        debug!("Getting geolocation data for IP: {}", processed.event.ip_address);
        processed.country_code = self.geoip_service.lookup_country_code(&processed.event.ip_address);
        if processed.country_code.is_some() {
            debug!("Geolocation successful: {:?}", processed.country_code);
        } else {
            debug!("Geolocation lookup returned no country code.");
        }
        Ok(())
    }

    /// Detect if the request is from a bot
    async fn detect_bot(&self, processed: &mut ProcessedEvent) -> Result<()> {
        processed.is_bot = bot_detection::is_bot(&processed.user_agent);
        Ok(())
    }

    /// Parse user agent to extract browser and OS information
    async fn parse_user_agent(&self, processed: &mut ProcessedEvent) -> Result<()> {
        debug!("Parsing user agent: {:?}", processed.user_agent);
        
        if let Some(result) = USER_AGENT_PARSER.parse(&processed.user_agent) {
            // Extract browser information
            processed.browser = Some(result.name.to_string());
            processed.browser_version = Some(result.version.to_string());
            
            // Extract OS information
            processed.os = Some(result.os.to_string());
            
            debug!(
                "User agent parsed: browser={:?}, version={:?}, os={:?}, device_type={:?}",
                processed.browser, processed.browser_version, processed.os, processed.device_type
            );
        } else {
            debug!("Failed to parse user agent: {}", processed.user_agent);
        }
        
        Ok(())
    }
    
    async fn detect_device_type_from_resolution(&self, processed: &mut ProcessedEvent) -> Result<()> {
        if let Some((w, _h)) = processed.event.raw.screen_resolution.split_once('x') {
            if let Ok(width) = w.trim().parse::<u32>() {
                match width {
                    0..=575 => processed.device_type = Some("mobile".to_string()),
                    576..=991 => processed.device_type = Some("tablet".to_string()),
                    992..=1439 => processed.device_type = Some("laptop".to_string()),
                    _ => processed.device_type = Some("desktop".to_string()),
                }
            } else {
                processed.device_type = Some("unknown".to_string());
            }
        } else {
            processed.device_type = Some("unknown".to_string());
        }

        Ok(())
    } 
}