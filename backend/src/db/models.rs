use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use strum_macros::EnumString;
use crate::processing::{BotEvent, ProcessedEvent};

// Ensure field order exactly matches ClickHouse table schema
#[derive(clickhouse::Row, Serialize, Debug, Deserialize)]
pub struct EventRow {
    pub site_id: String,
    pub visitor_id: u64,
    pub session_id: u64,
    pub domain: String,
    pub url: String,
    pub device_type: String,
    pub country_code: String,
    pub subdivision_code: String,
    pub city: String,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub timestamp: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::date")]
    pub date: NaiveDate,
    pub browser: String,
    pub browser_version: String,
    pub os: String,
    pub os_version: String,
    pub referrer_source: String,
    pub referrer_source_canonical: String,
    pub referrer_source_name: String,
    pub referrer_search_term: String,
    pub referrer_url: String,
    pub utm_source: String,
    pub utm_medium: String,
    pub utm_campaign: String,
    pub utm_term: String,
    pub utm_content: String,
    pub event_type: EventType,
    pub custom_event_name: String,
    pub custom_event_json: String,
    pub outbound_link_url: String,
    pub cwv_cls: Option<f32>,
    pub cwv_lcp: Option<f32>,
    pub cwv_inp: Option<f32>,
    pub cwv_fcp: Option<f32>,
    pub cwv_ttfb: Option<f32>,
    pub scroll_depth_percentage: Option<f32>,
    pub scroll_depth_pixels: Option<f32>,
    pub error_exceptions: String,
    pub error_type: String,
    pub error_message: String,
    pub error_fingerprint: String,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub session_created_at: DateTime<Utc>,
    pub global_properties_keys: Vec<String>,
    pub global_properties_values: Vec<String>,
    pub page_duration_seconds: u32,
    pub asn: u32,
    pub asn_org: String,
}

// Ensure field order exactly matches ClickHouse table schema
#[derive(clickhouse::Row, Serialize, Debug)]
pub struct BotEventRow {
    pub site_id: String,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub timestamp: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::date")]
    pub date: NaiveDate,
    pub domain: String,
    pub url: String,
    pub referrer: String,
    pub user_agent: String,
    pub screen_resolution: String,
    pub event_name: String,
    pub bot_reasons: Vec<String>,
    pub asn: u32,
    pub asn_org: String,
}

impl BotEventRow {
    pub fn from_bot(event: BotEvent) -> Self {
        Self {
            site_id: event.site_id,
            timestamp: event.timestamp,
            date: event.timestamp.date_naive(),
            domain: event.domain.unwrap_or_default(),
            url: event.url,
            referrer: event.referrer,
            user_agent: event.user_agent,
            screen_resolution: event.screen_resolution,
            event_name: event.event_name,
            bot_reasons: event.bot_reasons,
            asn: event.asn,
            asn_org: event.asn_org,
        }
    }
}

/// One active session recovered from `analytics.sessions`, used to warm the in-memory
/// session cache on boot. Field order must match the `SELECT` in `fetch_active_sessions`.
#[derive(clickhouse::Row, Deserialize)]
pub struct ActiveSessionRow {
    pub site_id: String,
    pub visitor_id: u64,
    pub session_id: u64,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub session_created_at: DateTime<Utc>,
}

#[derive(clickhouse::Row, Serialize, Debug, Deserialize)]
pub struct SessionReplayRow {
    pub site_id: String,
    pub session_id: u64,
    pub visitor_id: u64,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub started_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub ended_at: DateTime<Utc>,
    pub duration: u32,
    #[serde(with = "clickhouse::serde::chrono::date")]
    pub date: NaiveDate,
    pub size_bytes: u64,
    pub event_count: u32,
    pub s3_prefix: String,
    pub start_url: String,
    pub storage: String,
    pub client_started_at_ms: i64,
    pub client_ended_at_ms: i64,
    pub error_fingerprints: Vec<String>,
    pub recorded_error_count: u32,
}

#[derive(clickhouse::Row, Deserialize, Clone)]
pub struct SessionReplayMetaRow {
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub started_at: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    pub ended_at: DateTime<Utc>,
    pub size_bytes: u64,
    pub start_url: String,
    pub event_count: u32,
    pub visitor_id: u64,
    pub client_started_at_ms: i64,
    pub client_ended_at_ms: i64,
    pub error_fingerprints: Vec<String>,
    pub recorded_error_count: u32,
}

#[derive(clickhouse::Row, Serialize, Debug, Deserialize)]
pub struct SessionReplaySegmentRow {
    pub site_id: String,
    pub session_id: u64,
    pub filename: String,
    pub epoch_ms: i64,
    #[serde(with = "clickhouse::serde::chrono::date")]
    pub date: NaiveDate,
    pub size_bytes: u64,
    pub data: String,
}

#[derive(Debug, EnumString, Serialize_repr, Deserialize_repr)]
#[strum(serialize_all = "snake_case")]
#[repr(u8)]
pub enum EventType {
    Pageview = 1,
    Custom = 2,
    OutboundLink = 3,
    Cwv = 4,
    ScrollDepth = 5,
    ClientError = 6,
    Engagement = 7,
}

#[derive(clickhouse::Row, Serialize, Debug)]
pub struct ReferrerSourceCategoryRow {
    pub generation: u64,
    pub key: String,
    pub medium: String,
}

impl EventRow {
    /// Returns None when the event type has no ClickHouse enum value.
    pub fn from_processed(event: ProcessedEvent) -> Option<Self> {
        let timestamp = event.timestamp;

        let event_type = match event.event_type.parse() {
            Ok(event_type) => event_type,
            Err(_) => {
                tracing::warn!(
                    event_type = %event.event_type,
                    site_id = %event.site_id,
                    "Unknown event type, dropping event"
                );
                return None;
            }
        };

        Some(Self {
            site_id: event.site_id,
            visitor_id: event.visitor_fingerprint,
            session_id: event.session_id,
            domain: event.domain.unwrap_or_else(|| "unknown".to_string()),
            url: event.url,
            device_type: event.device_type.unwrap_or_else(|| "unknown".to_string()),
            country_code: event.country_code.unwrap_or_default(),
            subdivision_code: event.subdivision_code.unwrap_or_default(),
            city: event.city.unwrap_or_default(),
            timestamp,
            date: timestamp.date_naive(),
            browser: event.browser.unwrap_or_else(|| "unknown".to_string()),
            browser_version: event.browser_version.unwrap_or_default(),
            os: event.os.unwrap_or_else(|| "unknown".to_string()),
            os_version: event.os_version.unwrap_or_default(),
            referrer_source: event.referrer_info.source_type.as_str().to_string(),
            referrer_source_canonical: event.referrer_info.source_canonical.unwrap_or_default(),
            referrer_source_name: event.referrer_info.source_name.unwrap_or_default(),
            referrer_search_term: event.referrer_info.search_term.unwrap_or_default(),
            referrer_url: event.referrer_info.url.unwrap_or_default(),
            utm_source: event.campaign_info.utm_source.unwrap_or_default(),
            utm_medium: event.campaign_info.utm_medium.unwrap_or_default(),
            utm_campaign: event.campaign_info.utm_campaign.unwrap_or_default(),
            utm_term: event.campaign_info.utm_term.unwrap_or_default(),
            utm_content: event.campaign_info.utm_content.unwrap_or_default(),
            event_type,
            custom_event_name: event.custom_event_name,
            custom_event_json: event.custom_event_json,
            outbound_link_url: event.outbound_link_url,
            cwv_cls: event.cwv_cls,
            cwv_lcp: event.cwv_lcp,
            cwv_inp: event.cwv_inp,
            cwv_fcp: event.cwv_fcp,
            cwv_ttfb: event.cwv_ttfb,
            scroll_depth_percentage: event.scroll_depth_percentage,
            scroll_depth_pixels: event.scroll_depth_pixels,
            error_exceptions: event.error_exceptions,
            error_type: event.error_type,
            error_message: event.error_message,
            error_fingerprint: event.error_fingerprint,
            session_created_at: event.session_created_at,
            global_properties_keys: event.global_properties_keys,
            global_properties_values: event.global_properties_values,
            page_duration_seconds: event.page_duration_seconds,
            asn: event.asn,
            asn_org: event.asn_org,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::analytics::{AnalyticsEvent, RawTrackingEvent};
    use crate::campaign::CampaignInfo;
    use crate::referrer::ReferrerInfo;

    fn processed_event(event_type: &str) -> ProcessedEvent {
        let raw = RawTrackingEvent {
            site_id: "test-site".to_string(),
            event_name: event_type.to_string(),
            is_custom_event: false,
            properties: String::new(),
            url: "https://example.com/".to_string(),
            referrer: None,
            user_agent: "test-agent".to_string(),
            screen_resolution: "1920x1080".to_string(),
            timestamp: Some(1_700_000_000),
            automation: false,
            outbound_link_url: None,
            cwv_cls: None,
            cwv_lcp: None,
            cwv_inp: None,
            cwv_fcp: None,
            cwv_ttfb: None,
            scroll_depth_percentage: None,
            scroll_depth_pixels: None,
            error_exceptions: None,
            global_properties: None,
            page_duration_seconds: None,
        };

        ProcessedEvent {
            event: AnalyticsEvent::new(raw, "127.0.0.1".to_string(), "test-agent".to_string(), String::new(), false),
            event_type: event_type.to_string(),
            session_id: 1,
            session_created_at: chrono::Utc::now(),
            country_code: None,
            subdivision_code: None,
            city: None,
            browser: None,
            browser_version: None,
            os: None,
            os_version: None,
            device_type: None,
            site_id: "test-site".to_string(),
            visitor_fingerprint: 1,
            timestamp: chrono::Utc::now(),
            domain: Some("example.com".to_string()),
            url: "/".to_string(),
            referrer_info: ReferrerInfo::default(),
            user_agent: "test-agent".to_string(),
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
            asn: 0,
            asn_org: String::new(),
        }
    }

    #[test]
    fn unknown_event_type_is_dropped_instead_of_panicking() {
        assert!(EventRow::from_processed(processed_event("not_a_real_event_type")).is_none());
    }

    #[test]
    fn known_event_types_convert() {
        for name in ["pageview", "custom", "outbound_link", "cwv", "engagement"] {
            assert!(EventRow::from_processed(processed_event(name)).is_some());
        }
    }
}
