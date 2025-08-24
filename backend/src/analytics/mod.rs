use serde::{Deserialize, Serialize};
use nanoid::nanoid;

mod fingerprint;
pub use fingerprint::*;

/// Raw tracking data received from the client
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RawTrackingEvent {
    /// Site identifier
    pub site_id: String,
    /// Name of event
    pub event_name: String,
    /// Is event custom
    pub is_custom_event: bool,
    /// String encoded custom JSON properties
    pub properties: String,
    /// Page URL
    pub url: String,
    /// Referrer URL
    pub referrer: Option<String>,
    /// User agent
    pub user_agent: String,
    /// Screen resolution
    pub screen_resolution: String,
    /// Timestamp of the event
    pub timestamp: u64,
    /// Outbound link URL (only for outbound_link events)
    pub outbound_link_url: Option<String>,
}

/// The main analytics event type that includes server-side data
#[derive(Debug, Clone)]
pub struct AnalyticsEvent {
    /// Raw tracking data from the client
    pub raw: RawTrackingEvent,
    /// Client IP address
    pub ip_address: String,
}

impl AnalyticsEvent {
    pub fn new(raw: RawTrackingEvent, ip_address: String) -> Self {
        Self {
            raw,
            ip_address,
        }
    }
}

/// Generate a unique site ID
pub fn generate_site_id() -> String {
    nanoid!(12)
} 