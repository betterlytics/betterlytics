use serde::{Deserialize, Serialize};
use crate::validation::SiteConfigStatus;
use nanoid::nanoid;

mod fingerprint;
mod device;
pub use fingerprint::*;
pub use device::*;

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
    /// Core Web Vitals metrics (only for cwv events)
    pub cwv_cls: Option<f32>,
    pub cwv_lcp: Option<f32>,
    pub cwv_inp: Option<f32>,
    pub cwv_fcp: Option<f32>,
    pub cwv_ttfb: Option<f32>,
}

/// The main analytics event type that includes server-side data
#[derive(Debug, Clone)]
pub struct AnalyticsEvent {
    /// Raw tracking data from the client
    pub raw: RawTrackingEvent,
    /// Client IP address
    pub ip_address: String,
    /// Site-config status determined during validation
    pub site_config_status: SiteConfigStatus,
}

impl AnalyticsEvent {
    pub fn new(raw: RawTrackingEvent, ip_address: String, site_config_status: SiteConfigStatus) -> Self {
        Self {
            raw,
            ip_address,
            site_config_status,
        }
    }
}

/// Generate a unique site ID
pub fn generate_site_id() -> String {
    nanoid!(12)
} 