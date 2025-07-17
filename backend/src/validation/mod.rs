use anyhow::Result;
use chrono::{DateTime, Utc};
use std::net::IpAddr;
use std::str::FromStr;
use url::Url;
use crate::analytics::RawTrackingEvent;

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
        self.validate_required_fields(&raw_event)?;
        self.validate_payload_sizes(&raw_event)?;
        self.validate_formats(&raw_event, &ip_address)?;

        // only present for custom events
        if !raw_event.properties.is_empty() {
            self.validate_properties_json(&raw_event.properties)?;
        }

        Ok(ValidatedTrackingEvent {
            raw: raw_event,
            ip_address,
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
}

/// Check if a string contains any control characters
fn contains_control_characters(input: &str) -> bool {
    input.chars().any(|c| c.is_control())
}

/// Check if a string contains control characters (excluding newlines and tabs for custom properties)
fn contains_dangerous_control_characters(input: &str) -> bool {
    input.chars().any(|c| c.is_control() && c != '\n' && c != '\t')
}