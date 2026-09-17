use std::env;
use std::path::PathBuf;
use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReplayStorage {
    S3,
    ClickHouse,
}

impl ReplayStorage {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::S3 => "s3",
            Self::ClickHouse => "clickhouse",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GeolocationMode {
    Disabled,
    Countries,
    Subdivisions,
}

impl GeolocationMode {
    pub fn is_enabled(self) -> bool {
        self != GeolocationMode::Disabled
    }

    pub fn has_subdivisions(self) -> bool {
        self == GeolocationMode::Subdivisions
    }
}

#[derive(Debug)]
pub struct Config {
    pub server_port: u16,
    pub server_host: String,
    pub log_level: String,
    pub clickhouse_url: String,
    pub clickhouse_user: String,
    pub clickhouse_password: String,
    // GeoIP configuration
    pub geolocation_mode: GeolocationMode,
    pub maxmind_account_id: Option<String>,
    pub maxmind_license_key: Option<String>,
    pub geoip_db_path: PathBuf,
    pub asn_db_path: PathBuf,
    pub enable_asn_lookup: bool,
    /// Persist per-event bot signals to analytics.bot_events
    pub enable_bot_event_log: bool,
    pub geoip_update_interval: Duration,
    // Referrer and User Agent parsing configuration
    pub referrer_db_path: PathBuf,
    pub custom_referrers_path: PathBuf,
    pub ga4_source_categories_path: PathBuf,
    pub ua_regexes_path: PathBuf,
    pub data_retention_days: i32,
    // Monitoring configuration
    pub enable_monitoring: bool,
    pub enable_uptime_monitoring: bool,
    pub monitor_database_url: Option<String>,
    pub job_queue_database_url: Option<String>,
    pub monitor_clickhouse_table: String,
    pub monitor_incidents_table: String,
    // Session replay configuration
    pub enable_session_replay: bool,
    // Warm the in-memory session cache from ClickHouse on boot (so sessions survive restarts)
    pub session_cache_warm_enabled: bool,
    // S3 session replay storage configuration
    pub s3_enabled: bool,
    pub s3_region: Option<String>,
    pub s3_bucket: Option<String>,
    pub s3_access_key_id: Option<String>,
    pub s3_secret_access_key: Option<String>,
    pub s3_endpoint: Option<String>, // allow custom/local endpoints (e.g., MinIO, LocalStack); internal only, never browser-reachable
    pub s3_force_path_style: bool,   // needed for many local providers
    pub s3_sse_enabled: bool,        // enable SSE (AES256) on uploaded objects
    pub replay_storage: ReplayStorage,
    // Site-config cache database (read-only)
    pub site_config_database_url: String,
    // Salt database (read-write) - stores the secret rotating fingerprint salts
    pub salts_database_url: String,
    // Development mode - allows localhost monitoring targets
    pub is_development: bool,
    // Public-facing base URL (used for dashboard links in push notifications)
    pub public_base_url: String,
    // Integration config encryption key (32 bytes)
    pub integration_encryption_key: Option<[u8; 32]>,
    // Pushover integration
    pub pushover_app_token: Option<String>,
}

impl Config {
    pub fn new() -> Self {
        // Load environment variables from the root directory (parent of backend)
        let root_env_path = PathBuf::from("../.env");
        dotenv::from_path(&root_env_path).ok();

        let geo_enabled = env::var("ENABLE_GEOLOCATION")
            .map(|val| val.to_lowercase() == "true")
            .unwrap_or(false);
        let geo_mode = env::var("GEOLOCATION_MODE")
            .unwrap_or_else(|_| "country".to_string())
            .to_lowercase();
        let geolocation_mode = if !geo_enabled {
            GeolocationMode::Disabled
        } else if geo_mode == "full" {
            GeolocationMode::Subdivisions
        } else {
            GeolocationMode::Countries
        };

        let data_retention_days: i32 = env::var("DATA_RETENTION_DAYS")
            .unwrap_or_else(|_| "365".to_string())
            .parse()
            .unwrap_or(365);

        let s3_enabled = env::var("S3_ENABLED").map(|v| v.to_lowercase() == "true").unwrap_or(false);
        let replay_storage = match env::var("REPLAY_STORAGE").ok().as_deref() {
            Some("s3") => ReplayStorage::S3,
            Some("clickhouse") => ReplayStorage::ClickHouse,
            Some(other) => panic!("REPLAY_STORAGE must be 's3' or 'clickhouse', got '{}'", other),
            None => if s3_enabled { ReplayStorage::S3 } else { ReplayStorage::ClickHouse },
        };

        let config = Config {
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
            geolocation_mode,
            maxmind_account_id: env::var("MAXMIND_ACCOUNT_ID").ok().filter(|v| !v.is_empty()),
            maxmind_license_key: env::var("MAXMIND_LICENSE_KEY").ok().filter(|v| !v.is_empty()),
            geoip_db_path: env::var("GEOIP_DB_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| if geolocation_mode.has_subdivisions() {
                    PathBuf::from("assets/geoip/GeoLite2-City.mmdb")
                } else {
                    PathBuf::from("assets/geoip/GeoLite2-Country.mmdb")
                }),
            asn_db_path: env::var("ASN_DB_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/geoip/GeoLite2-ASN.mmdb")),
            enable_asn_lookup: env::var("ENABLE_ASN_LOOKUP")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            enable_bot_event_log: env::var("ENABLE_BOT_EVENT_LOG")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
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
            custom_referrers_path: env::var("CUSTOM_REFERRERS_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/referrers_lists/custom_referrers.json")),
            ga4_source_categories_path: env::var("GA4_SOURCE_CATEGORIES_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/referrers_lists/ga4-source-categories.csv")),
            ua_regexes_path: env::var("UA_REGEXES_PATH")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("assets/user_agent_headers/regexes.yaml")),
            data_retention_days,
            // Monitoring configuration
            enable_monitoring: env::var("ENABLE_MONITORING")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            enable_uptime_monitoring: env::var("ENABLE_UPTIME_MONITORING")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            monitor_database_url: env::var("MONITORING_DATABASE_URL")
                .ok()
                .filter(|url| !url.trim().is_empty()),
            job_queue_database_url: env::var("JOB_QUEUE_DATABASE_URL")
                .ok()
                .filter(|url| !url.trim().is_empty()),
            monitor_clickhouse_table: env::var("CLICKHOUSE_MONITOR_TABLE")
                .unwrap_or_else(|_| "analytics.monitor_results".to_string()),
            monitor_incidents_table: env::var("CLICKHOUSE_INCIDENT_TABLE")
                .unwrap_or_else(|_| "analytics.monitor_incidents".to_string()),
            // Session replay configuration
            enable_session_replay: env::var("SESSION_REPLAYS_ENABLED")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            // On by default; can be used to disable session warming if it catches a bad query plan
            session_cache_warm_enabled: env::var("ENABLE_SESSION_CACHE_WARM")
                .map(|val| val.to_lowercase() != "false")
                .unwrap_or(true),
            // S3 configuration (optional; defaults to disabled)
            s3_enabled,
            s3_region: env::var("S3_REGION").ok(),
            s3_bucket: env::var("S3_BUCKET").ok(),
            s3_access_key_id: env::var("S3_ACCESS_KEY_ID").ok(),
            s3_secret_access_key: env::var("S3_SECRET_ACCESS_KEY").ok(),
            s3_endpoint: env::var("S3_ENDPOINT").ok(),
            s3_force_path_style: env::var("S3_FORCE_PATH_STYLE").map(|v| v.to_lowercase() == "true").unwrap_or(false),
            s3_sse_enabled: env::var("S3_SSE_ENABLED").map(|v| v.to_lowercase() == "true").unwrap_or(false),
            replay_storage,
            site_config_database_url: env::var("SITE_CONFIG_DATABASE_URL")
                .expect("SITE_CONFIG_DATABASE_URL must be set to a valid Postgres URL for the site-config cache database"),
            salts_database_url: env::var("SALTS_DATABASE_URL")
                .expect("SALTS_DATABASE_URL must be set to a valid read-write Postgres URL for the fingerprint salts table"),
            is_development: env::var("IS_DEVELOPMENT")
                .map(|val| val.to_lowercase() == "true")
                .unwrap_or(false),
            // Public-facing base URL for dashboard links in push notifications
            public_base_url: env::var("PUBLIC_BASE_URL")
                .unwrap_or_else(|_| "https://betterlytics.io".to_string()),
            // Integration config encryption key
            integration_encryption_key: env::var("INTEGRATION_ENCRYPTION_KEY").ok().map(|key| {
                let bytes = key.as_bytes();
                assert!(
                    bytes.len() == 32,
                    "INTEGRATION_ENCRYPTION_KEY must be exactly 32 bytes, got {}",
                    bytes.len()
                );
                let mut arr = [0u8; 32];
                arr.copy_from_slice(bytes);
                arr
            }),
            // Pushover integration
            pushover_app_token: env::var("PUSHOVER_APP_TOKEN").ok(),
        };

        assert!(
            !config.enable_session_replay
                || config.replay_storage == ReplayStorage::ClickHouse
                || (config.s3_enabled && config.s3_bucket.is_some()),
            "SESSION_REPLAYS_ENABLED=true with REPLAY_STORAGE=s3 requires S3_ENABLED=true and S3_BUCKET"
        );

        config
    }
}
