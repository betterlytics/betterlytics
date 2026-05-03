use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use strum_macros::EnumString;
use crate::processing::ProcessedEvent;

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
    pub error_fingerprints: Vec<String>,
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

impl EventRow {
    pub fn from_processed(event: ProcessedEvent) -> Self {
        let timestamp = event.timestamp;

        Self {
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
            referrer_source_name: event.referrer_info.source_name.unwrap_or_default(),
            referrer_search_term: event.referrer_info.search_term.unwrap_or_default(),
            referrer_url: event.referrer_info.url.unwrap_or_default(),
            utm_source: event.campaign_info.utm_source.unwrap_or_default(),
            utm_medium: event.campaign_info.utm_medium.unwrap_or_default(),
            utm_campaign: event.campaign_info.utm_campaign.unwrap_or_default(),
            utm_term: event.campaign_info.utm_term.unwrap_or_default(),
            utm_content: event.campaign_info.utm_content.unwrap_or_default(),
            event_type: event.event_type.parse().unwrap(),
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
        }
    }
}
