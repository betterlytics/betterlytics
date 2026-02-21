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
    // Monitoring configuration
    pub enable_monitoring: bool,
    pub enable_uptime_monitoring: bool,
    pub monitor_database_url: Option<String>,
    pub monitor_clickhouse_table: String,
    pub monitor_incidents_table: String,
    // Session replay configuration
    pub enable_session_replay: bool,
    // S3 session replay storage configuration
    pub s3_enabled: bool,
    pub s3_region: Option<String>,
    pub s3_bucket: Option<String>,
    pub s3_access_key_id: Option<String>,
    pub s3_secret_access_key: Option<String>,
    pub s3_endpoint: Option<String>, // allow custom/local endpoints (e.g., MinIO, LocalStack)
    pub s3_force_path_style: bool,   // needed for many local providers
    pub s3_sse_enabled: bool,        // enable SSE (AES256) on uploaded objects
    // Site-config cache database (read-only)
    pub site_config_database_url: String,
    // Development mode - allows localhost monitoring targets
    pub is_development: bool,
    // Public-facing base URL (used for dashboard links in emails, etc.)
    pub public_base_url: String,
    // Email configuration (None = email disabled)
    pub email: Option<EmailConfig>,
    // Integration config encryption key
    pub nextauth_secret: Option<String>,
    // Pushover integration
    pub pushover_app_token: Option<String>,
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
            // Monitoring configuration
            enable_monitoring: env::var("ENABLE_MONITORING")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            enable_uptime_monitoring: env::var("ENABLE_UPTIME_MONITORING")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            monitor_database_url: env::var("MONITORING_DATABASE_URL").ok(),
            monitor_clickhouse_table: env::var("CLICKHOUSE_MONITOR_TABLE")
                .unwrap_or_else(|_| "analytics.monitor_results".to_string()),
            monitor_incidents_table: env::var("CLICKHOUSE_INCIDENT_TABLE")
                .unwrap_or_else(|_| "analytics.monitor_incidents".to_string()),
            // Session replay configuration
            enable_session_replay: env::var("SESSION_REPLAYS_ENABLED")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            // S3 configuration (optional; defaults to disabled)
            s3_enabled: env::var("S3_ENABLED").map(|v| v.to_lowercase() == "true").unwrap_or(false),
            s3_region: env::var("S3_REGION").ok(),
            s3_bucket: env::var("S3_BUCKET").ok(),
            s3_access_key_id: env::var("S3_ACCESS_KEY_ID").ok(),
            s3_secret_access_key: env::var("S3_SECRET_ACCESS_KEY").ok(),
            s3_endpoint: env::var("S3_ENDPOINT").ok(),
            s3_force_path_style: env::var("S3_FORCE_PATH_STYLE").map(|v| v.to_lowercase() == "true").unwrap_or(false),
            s3_sse_enabled: env::var("S3_SSE_ENABLED").map(|v| v.to_lowercase() == "true").unwrap_or(false),
            site_config_database_url: env::var("SITE_CONFIG_DATABASE_URL")
                .expect("SITE_CONFIG_DATABASE_URL must be set to a valid Postgres URL for the site-config cache database"),
            is_development: env::var("IS_DEVELOPMENT")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            // Public-facing base URL for dashboard links in emails, etc
            public_base_url: env::var("PUBLIC_BASE_URL")
                .unwrap_or_else(|_| "https://betterlytics.io".to_string()),
            // Email configuration (None = email disabled)
            email: EmailConfig::from_env(),
            // Integration config encryption key
            nextauth_secret: env::var("NEXTAUTH_SECRET").ok(),
            // Pushover integration
            pushover_app_token: env::var("PUSHOVER_APP_TOKEN").ok(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct EmailConfig {
    pub api_key: String,
    pub from_email: String,
    pub from_name: String,
    pub is_development: bool,
}

impl EmailConfig {
    pub fn from_env() -> Option<Self> {
        let email_enabled = env::var("ENABLE_EMAILS")
            .map(|val| val.to_lowercase() == "true")
            .unwrap_or(false);

        if !email_enabled {
            return None;
        }

        let api_key = env::var("MAILER_SEND_API_TOKEN").ok()?;

        Some(Self {
            api_key,
            from_email: env::var("ALERT_FROM_EMAIL")
                .unwrap_or_else(|_| "alerts@betterlytics.io".to_string()),
            from_name: env::var("ALERT_FROM_NAME")
                .unwrap_or_else(|_| "Betterlytics Alerts".to_string()),
            is_development: env::var("IS_DEVELOPMENT")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
        })
    }
}