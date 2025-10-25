use anyhow::Result;
use chrono::{DateTime, Utc};
use std::net::IpAddr;
use std::str::FromStr;
use url::Url;
use crate::analytics::RawTrackingEvent;
use sha2::{Digest, Sha256};
use tracing::warn;

#[derive(Debug, Clone)]
pub struct ValidationConfig {
    pub max_custom_properties_size: usize,
    pub max_url_length: usize,
    pub max_event_name_length: usize,
    pub max_site_id_length: usize,
    pub max_user_agent_length: usize,
    pub max_timestamp_drift_seconds: i64,
}

impl Default for ValidationConfig {
    fn default() -> Self {
        Self {
            max_custom_properties_size: 10 * 1024,    // 10KB - pretty generous in my opinion
            max_url_length: 2048,                     // This is a common limit for URLs
            max_event_name_length: 100,               // Event name is usually short, but we should keep leeway for extra long event names
            max_site_id_length: 100,                  // Site ID is usually short, but we should keep leeway for extra long domain names
            max_user_agent_length: 8 * 1024,          // 8192 bytes - same limit that apache uses (https://httpd.apache.org/docs/2.2/mod/core.html#limitrequestfieldsize)
            max_timestamp_drift_seconds: 300,         // 5 minutes - we should allow for some clock drift to account for packet latency
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ValidationError {
    #[error("Invalid site ID: {0}")]
    InvalidSiteId(String),
    #[error("Invalid URL: {0}")]
    InvalidUrl(String),
    #[error("Invalid event name: {0}")]
    InvalidEventName(String),
    #[error("Invalid timestamp: {0}")]
    InvalidTimestamp(String),
    #[error("Invalid IP address: {0}")]
    InvalidIpAddress(String),
    #[error("Invalid user agent: {0}")]
    InvalidUserAgent(String),
    #[error("Payload too large: {0}")]
    PayloadTooLarge(String),
    #[error("Invalid JSON: {0}")]
    InvalidJson(String),
    #[error("Invalid outbound link URL: {0}")]
    InvalidOutboundLinkUrl(String),
    #[error("Invalid scroll depth: {0}")]
    InvalidScrollDepth(String),
}

#[derive(Debug, Clone)]
pub struct ValidatedTrackingEvent {
    pub raw: RawTrackingEvent,
    pub ip_address: String,
}

pub struct EventValidator {
    config: ValidationConfig,
}

impl EventValidator {
    pub fn new(config: ValidationConfig) -> Self {
        Self { config }
    }

    pub async fn validate_event(
        &self,
        raw_event: RawTrackingEvent,
        ip_address: String,
    ) -> Result<ValidatedTrackingEvent, ValidationError> {
        let result = self.validate_event_internal(&raw_event, &ip_address);
        
        // Log sanitized rejection details if validation fails
        if let Err(ref error) = result {
            self.log_sanitized_rejection(error, &raw_event, &ip_address);
        }
        
        result
    }

    fn validate_event_internal(
        &self,
        raw_event: &RawTrackingEvent,
        ip_address: &str,
    ) -> Result<ValidatedTrackingEvent, ValidationError> {
        self.validate_required_fields(raw_event)?;
        self.validate_payload_sizes(raw_event)?;
        self.validate_formats(raw_event, ip_address)?;
        
        if raw_event.event_name == "outbound_link" {
            self.validate_outbound_link_url(raw_event)?;
        }

        if raw_event.event_name.eq_ignore_ascii_case("cwv") {
            self.validate_cwv_fields(raw_event)?;
        }

        if !raw_event.properties.is_empty() {
            self.validate_properties_json(&raw_event.properties)?;
        }

        if raw_event.event_name == "scroll_depth" {
            self.validate_scroll_depth_event(raw_event)?;
        }

        Ok(ValidatedTrackingEvent {
            raw: raw_event.clone(),
            ip_address: ip_address.to_string(),
        })
    }

    /// Validate required fields are not empty and don't contain control characters
    fn validate_required_fields(&self, raw_event: &RawTrackingEvent) -> Result<(), ValidationError> {
        if raw_event.site_id.is_empty() {
            return Err(ValidationError::InvalidSiteId("Site ID cannot be empty".to_string()));
        }
        if raw_event.url.is_empty() {
            return Err(ValidationError::InvalidUrl("URL cannot be empty".to_string()));
        }
        if raw_event.event_name.is_empty() {
            return Err(ValidationError::InvalidEventName("Event name cannot be empty".to_string()));
        }
        if raw_event.user_agent.is_empty() {
            return Err(ValidationError::InvalidUserAgent("User agent cannot be empty".to_string()));
        }

        if contains_control_characters(&raw_event.site_id) {
            return Err(ValidationError::InvalidSiteId("Site ID contains invalid control characters".to_string()));
        }
        if contains_control_characters(&raw_event.url) {
            return Err(ValidationError::InvalidUrl("URL contains invalid control characters".to_string()));
        }
        if contains_control_characters(&raw_event.event_name) {
            return Err(ValidationError::InvalidEventName("Event name contains invalid control characters".to_string()));
        }
        if contains_control_characters(&raw_event.user_agent) {
            return Err(ValidationError::InvalidUserAgent("User agent contains invalid control characters".to_string()));
        }
        if let Some(ref referrer) = raw_event.referrer {
            if contains_control_characters(referrer) {
                return Err(ValidationError::InvalidUrl("Referrer contains invalid control characters".to_string()));
            }
        }

        Ok(())
    }

    /// Validate payload sizes to reject excessively large payloads
    fn validate_payload_sizes(&self, raw_event: &RawTrackingEvent) -> Result<(), ValidationError> {
        if raw_event.site_id.len() > self.config.max_site_id_length {
            return Err(ValidationError::InvalidSiteId("Site ID too long".to_string()));
        }
        if raw_event.url.len() > self.config.max_url_length {
            return Err(ValidationError::InvalidUrl("URL too long".to_string()));
        }
        if raw_event.event_name.len() > self.config.max_event_name_length {
            return Err(ValidationError::InvalidEventName("Event name too long".to_string()));
        }
        if raw_event.user_agent.len() > self.config.max_user_agent_length {
            return Err(ValidationError::InvalidUserAgent("User agent too long".to_string()));
        }
        if raw_event.properties.len() > self.config.max_custom_properties_size {
            return Err(ValidationError::PayloadTooLarge("Properties payload too large".to_string()));
        }
        Ok(())
    }

    /// Basic format validation
    fn validate_formats(&self, raw_event: &RawTrackingEvent, ip_address: &str) -> Result<(), ValidationError> {
        // Validate URL format
        if let Err(_) = Url::parse(&raw_event.url) {
            return Err(ValidationError::InvalidUrl("Invalid URL format".to_string()));
        }

        // Validate IP address format
        if IpAddr::from_str(ip_address).is_err() {
            return Err(ValidationError::InvalidIpAddress("Invalid IP address format".to_string()));
        }

        // Validate timestamp is reasonable (config allows for some clock drift to account for packet latency)
        if let Some(event_time) = DateTime::from_timestamp(raw_event.timestamp as i64, 0) {
            let now = Utc::now();
            let drift = (event_time - now).num_seconds().abs();
            if drift > self.config.max_timestamp_drift_seconds {
                return Err(ValidationError::InvalidTimestamp("Timestamp too far from current time".to_string()));
            }
        } else {
            return Err(ValidationError::InvalidTimestamp("Invalid timestamp".to_string()));
        }

        Ok(())
    }

    /// Validate properties JSON structure
    fn validate_properties_json(&self, properties: &str) -> Result<(), ValidationError> {
        // For custom properties, we're more lenient with control characters
        // (allow newlines/tabs in case someone tracks form texts)
        // but we still disallow and reject dangerous control characters
        if contains_dangerous_control_characters(properties) {
            return Err(ValidationError::InvalidJson("Properties contain dangerous control characters".to_string()));
        }

        match serde_json::from_str::<serde_json::Value>(properties) {
            Ok(_) => Ok(()),
            Err(e) => Err(ValidationError::InvalidJson(format!("Invalid JSON: {}", e))),
        }
    }

    fn validate_scroll_depth_event(&self, raw_event: &RawTrackingEvent) -> Result<(), ValidationError> {
        let scroll_depth_percentage = match &raw_event.scroll_depth_percentage {
            Some(percentage) => percentage,
            None => return Err(ValidationError::InvalidScrollDepth("Missing scroll_depth_percentage value".to_string())),
        };

        let scroll_depth_pixels = match &raw_event.scroll_depth_pixels {
            Some(pixels) => pixels,
            None => return Err(ValidationError::InvalidScrollDepth("Missing scroll_depth_pixels value".to_string())),
        };

        if *scroll_depth_percentage < 0.0 || *scroll_depth_percentage > 100.0 {
            return Err(ValidationError::InvalidScrollDepth("scroll_depth_percentage must be between 0 and 100".to_string()));
        }

        if *scroll_depth_pixels < 0.0 {
            return Err(ValidationError::InvalidScrollDepth("scroll_depth_pixels must be greater than 0".to_string()));
        }

        Ok(())
    }
    
    fn validate_outbound_link_url(&self, raw_event: &RawTrackingEvent) -> Result<(), ValidationError> {
        let outbound_url = match &raw_event.outbound_link_url {
            Some(url) => url,
            None => return Err(ValidationError::InvalidOutboundLinkUrl("Outbound link URL required for outbound_link events".to_string())),
        };

        if outbound_url.is_empty() {
            return Err(ValidationError::InvalidOutboundLinkUrl("Outbound link URL cannot be empty".to_string()));
        }

        // Check length using existing max_url_length config
        if outbound_url.len() > self.config.max_url_length {
            return Err(ValidationError::InvalidOutboundLinkUrl("Outbound link URL too long".to_string()));
        }

        if contains_control_characters(outbound_url) {
            return Err(ValidationError::InvalidOutboundLinkUrl("Outbound link URL contains invalid control characters".to_string()));
        }

        // Validate URL format
        let parsed_url = match Url::parse(outbound_url) {
            Ok(url) => url,
            Err(_) => return Err(ValidationError::InvalidOutboundLinkUrl("Invalid outbound link URL format".to_string())),
        };

        // Only allow http/https protocols for security
        match parsed_url.scheme() {
            "http" | "https" => {},
            _ => return Err(ValidationError::InvalidOutboundLinkUrl("Outbound link URL must use http or https protocol".to_string())),
        }

        // Validate that it's actually external (different domain from source)
        if let Ok(source_url) = Url::parse(&raw_event.url) {
            if let (Some(source_domain), Some(outbound_domain)) = (source_url.domain(), parsed_url.domain()) {
                if source_domain == outbound_domain {
                    return Err(ValidationError::InvalidOutboundLinkUrl("Outbound link URL must be external (different domain)".to_string()));
                }
            }
        }

        Ok(())
    }

    /// Validate Core Web Vitals fields when present
    fn validate_cwv_fields(&self, raw_event: &RawTrackingEvent) -> Result<(), ValidationError> {
        fn valid_f32(v: f32) -> bool { v.is_finite() }

        if let Some(v) = raw_event.cwv_cls { if !valid_f32(v) || v < 0.0 { return Err(ValidationError::InvalidJson("Invalid cwv_cls".to_string())); } }
        if let Some(v) = raw_event.cwv_lcp { if !valid_f32(v) || v < 0.0 { return Err(ValidationError::InvalidJson("Invalid cwv_lcp".to_string())); } }
        if let Some(v) = raw_event.cwv_inp { if !valid_f32(v) || v < 0.0 { return Err(ValidationError::InvalidJson("Invalid cwv_inp".to_string())); } }
        if let Some(v) = raw_event.cwv_fcp { if !valid_f32(v) || v < 0.0 { return Err(ValidationError::InvalidJson("Invalid cwv_fcp".to_string())); } }
        if let Some(v) = raw_event.cwv_ttfb { if !valid_f32(v) || v < 0.0 { return Err(ValidationError::InvalidJson("Invalid cwv_ttfb".to_string())); } }
        Ok(())
    }

    /// Log sanitized rejection details for debugging
    fn log_sanitized_rejection(
        &self,
        error: &ValidationError,
        raw_event: &RawTrackingEvent,
        ip_address: &str,
    ) {
        // Hash IP address for privacy
        let ip_hash = self.hash_ip_address(ip_address);
        
        warn!(
            rejection_reason = self.get_rejection_reason(error),
            site_id = %self.sanitize_and_truncate(&raw_event.site_id, 50),
            event_name = %self.sanitize_and_truncate(&raw_event.event_name, 50),
            ip_hash = %ip_hash,
            url_domain = %self.sanitize_and_truncate(&self.extract_domain(&raw_event.url), 100),
            url_path = %self.sanitize_and_truncate(&self.extract_path(&raw_event.url), 100),
            user_agent_prefix = %self.sanitize_and_truncate(&raw_event.user_agent, 1000),
            properties_size = %raw_event.properties.len(),
            "Event rejected by validation"
        );
    }

    pub fn get_rejection_reason(&self, error: &ValidationError) -> &'static str {
        match error {
            ValidationError::InvalidSiteId(_) => "invalid_site_id",
            ValidationError::InvalidUrl(_) => "invalid_url",
            ValidationError::InvalidEventName(_) => "invalid_event_name",
            ValidationError::InvalidTimestamp(_) => "invalid_timestamp",
            ValidationError::InvalidIpAddress(_) => "invalid_ip_address",
            ValidationError::InvalidUserAgent(_) => "invalid_user_agent",
            ValidationError::PayloadTooLarge(_) => "payload_too_large",
            ValidationError::InvalidJson(_) => "invalid_json",
            ValidationError::InvalidOutboundLinkUrl(_) => "invalid_outbound_link_url",
            ValidationError::InvalidScrollDepth(_) => "invalid_scroll_depth",
        }
    }

    fn hash_ip_address(&self, ip: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(ip.as_bytes());
        format!("{:x}", hasher.finalize())[..16].to_string()
    }

    /// Sanitize string for safe logging (escape control characters and limit length)
    fn sanitize_and_truncate(&self, s: &str, max_len: usize) -> String {
      s.escape_debug().take(max_len).collect()
    }

    fn extract_domain(&self, url: &str) -> String {
        if let Ok(parsed) = Url::parse(url) {
            parsed.host_str().unwrap_or("unknown").to_string()
        } else {
            "unknown".to_string()
        }
    }

    fn extract_path(&self, url: &str) -> String {
        if let Ok(parsed) = Url::parse(url) {
            parsed.path().to_string()
        } else {
            "/".to_string()
        }
    }
}

/// Check if a string contains any control characters
fn contains_control_characters(input: &str) -> bool {
    input.chars().any(|c| c.is_control())
}

/// Check if a string contains control characters (excluding newlines and tabs for custom properties)
fn contains_dangerous_control_characters(input: &str) -> bool {
    input.chars().any(|c| c.is_control() && c != '\n' && c != '\t')
}