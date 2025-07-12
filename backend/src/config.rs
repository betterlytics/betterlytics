use std::env;
use std::path::PathBuf;
use std::time::Duration;

#[derive(Debug)]
pub struct Config {
    pub server_port: u16,
    pub server_host: String,
    pub log_level: String,
    pub clickhouse_url: String,
    pub clickhouse_user: String,
    pub clickhouse_password: String,
    // GeoIP configuration
    pub enable_geolocation: bool,
    pub maxmind_account_id: Option<String>,
    pub maxmind_license_key: Option<String>,
    pub geoip_db_path: PathBuf,
    pub geoip_update_interval: Duration,
    // Referrer and User Agent parsing configuration
    pub referrer_db_path: PathBuf,
    pub ua_regexes_path: PathBuf,
    pub data_retention_days: i32,
    // Billing configuration
    pub enable_billing: bool,
    // Monitoring configuration
    pub enable_monitoring: bool,
}

impl Config {
    pub fn new() -> Self {
        // Load environment variables from the root directory (parent of backend)
        let root_env_path = PathBuf::from("../.env");
        dotenv::from_path(&root_env_path).ok();

        Config {
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
            server_host: env::var("SERVER_HOST")
                .unwrap_or_else(|_| "127.0.0.1".to_string()),
            log_level: env::var("LOG_LEVEL")
                .unwrap_or_else(|_| "info".to_string()),
            clickhouse_url: env::var("CLICKHOUSE_URL")
                .unwrap_or_else(|_| "http://localhost:8123".to_string()),
            clickhouse_user: env::var("CLICKHOUSE_BACKEND_USER")
                .unwrap_or_else(|_| "default".to_string()),
            clickhouse_password: env::var("CLICKHOUSE_BACKEND_PASSWORD")
                .unwrap_or_else(|_| "password".to_string()),
            // GeoIP configuration
            enable_geolocation: env::var("ENABLE_GEOLOCATION")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            maxmind_account_id: env::var("MAXMIND_ACCOUNT_ID").ok(),
            maxmind_license_key: env::var("MAXMIND_LICENSE_KEY").ok(),
            geoip_db_path: env::var("GEOIP_DB_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/geoip/GeoLite2-Country.mmdb")),
            geoip_update_interval: Duration::from_secs(
                env::var("GEOIP_UPDATE_INTERVAL")
                    .ok()
                    .and_then(|val| val.parse().ok())
                    .unwrap_or(24 * 60 * 60)
            ),
            // Referrer and User Agent parsing configuration
            referrer_db_path: env::var("REFERRER_DB_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/snowplow_referers/referers-latest.json")),
            ua_regexes_path: env::var("UA_REGEXES_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/user_agent_headers/regexes.yaml")),
            data_retention_days: env::var("DATA_RETENTION_DAYS")
                .unwrap_or_else(|_| "365".to_string())
                .parse()
                .unwrap_or(365),
            // Billing configuration
            enable_billing: env::var("ENABLE_BILLING")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            // Monitoring configuration
            enable_monitoring: env::var("ENABLE_MONITORING")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
        }
    }
} 