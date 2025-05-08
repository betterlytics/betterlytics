use anyhow::Result;
use tokio::sync::mpsc;
use crate::analytics::{AnalyticsEvent, generate_fingerprint};
use crate::db::SharedDatabase;
use crate::geoip::GeoIpService;
use tracing::{error, debug};
use crate::session;
use r2d2::Pool;
use redis::Client as RedisClient;
use std::sync::Arc;
use crate::bot_detection;
use woothee::parser::Parser;
use once_cell::sync::Lazy;
use url;

static USER_AGENT_PARSER: Lazy<Parser> = Lazy::new(|| Parser::new());

#[derive(Debug, Clone)]
pub struct ProcessedEvent {
    /// Base original event data sent from client through analytics.js script
    pub event: AnalyticsEvent,
    /// Sessionization - new sessions are created if the user has not generated any events in over 30 minutes
    pub session_id: String,
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
    /// Stripped URL without query parameters
    pub url: String,
    pub referrer: Option<String>,
    pub user_agent: String,
}

/// Event processor that handles real-time processing
pub struct EventProcessor {
    db: SharedDatabase,
    event_tx: mpsc::Sender<ProcessedEvent>,
    redis_pool: Arc<Pool<RedisClient>>,
    geoip_service: GeoIpService,
}

impl EventProcessor {
    pub fn new(db: SharedDatabase, geoip_service: GeoIpService) -> (Self, mpsc::Receiver<ProcessedEvent>) {
        let (event_tx, event_rx) = mpsc::channel(100_000);
        let redis_pool = session::REDIS_POOL.clone();
        (Self { db, event_tx, redis_pool, geoip_service }, event_rx)
    }

    pub async fn process_event(&self, event: AnalyticsEvent) -> Result<()> {
        let site_id = event.raw.site_id.clone();
        let timestamp = chrono::DateTime::from_timestamp(event.raw.timestamp as i64, 0).unwrap_or_else(|| chrono::Utc::now());
        let url = self.strip_url_query_params(&event.raw.url.clone());
        let referrer = event.raw.referrer.clone();
        let user_agent = event.raw.user_agent.clone();

        let mut processed = ProcessedEvent {
            event: event.clone(),
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
            url,
            referrer: referrer.clone(),
            user_agent: user_agent.clone(),
        };

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
            &self.redis_pool, 
            &site_id, 
            &processed.visitor_fingerprint, 
            &timestamp
        );

        match session_id_result {
            Ok(id) => processed.session_id = id,
            Err(e) => {
                error!("Failed to get session ID from Redis: {}. Event processing aborted for: {:?}", e, processed.event);
                return Ok(());
            }
        };

        if let Err(e) = self.detect_device_type_from_resolution(&mut processed).await {
            error!("Failed to detect device type from resolution: {}", e);
        }
        
        if let Err(e) = self.parse_user_agent(&mut processed).await {
            error!("Failed to parse user agent: {}", e);
        }
        
        if let Err(e) = self.update_real_time_metrics(&processed).await {
            error!("Failed to update real-time metrics: {}", e);
        }

        if let Err(e) = self.event_tx.send(processed).await {
            error!("Failed to send processed event: {}", e);
        }

        debug!("Processed event finished!");
        Ok(())
    }

    /// Strip query parameters from URL but keep fragment - we might wanna consider storing fragments separately
    fn strip_url_query_params(&self, url: &str) -> String {
        if let Ok(parsed_url) = url::Url::parse(url) {
            let mut clean = parsed_url.clone();
            clean.set_query(None);
            clean.to_string()
        } else {
            url.to_string()
        }
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
            
            // Extract device type
            processed.device_type = Some(result.category.to_string());
            
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

    /// Update real-time metrics in ClickHouse
    async fn update_real_time_metrics(&self, processed: &ProcessedEvent) -> Result<()> {
        debug!("Updating real-time metrics using session_id: {}", processed.session_id);
        // TODO: Implement real-time metrics update
        Ok(())
    }
}