pub mod config;
pub mod analytics;
pub mod db;
pub mod processing;
pub mod session;
pub mod geoip;
pub mod geoip_updater;
pub mod bot_detection;
pub mod referrer;
pub mod campaign;
pub mod ua_parser;
pub mod metrics;

// Re-export commonly used types
pub use analytics::{AnalyticsEvent, generate_site_id};
pub use db::{Database, SharedDatabase};
pub use processing::{EventProcessor, ProcessedEvent};
pub use config::Config;
pub use referrer::{ReferrerInfo, ReferrerSource, parse_referrer};
pub use campaign::{CampaignInfo, parse_campaign_params};
pub use ua_parser::{ParsedUserAgent, parse_user_agent};
pub use metrics::MetricsCollector;
