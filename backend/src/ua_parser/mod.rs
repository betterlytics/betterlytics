use std::path::Path;

use moka::sync::Cache;
use once_cell::sync::Lazy;
use std::sync::OnceLock;
use tracing::{debug, info};
use uaparser::{Parser, UserAgentParser};

static USER_AGENT_PARSER: OnceLock<UserAgentParser> = OnceLock::new();

static UA_CACHE: Lazy<Cache<String, (String, Option<String>, String, Option<String>)>> =
    Lazy::new(|| {
        Cache::builder()
            .max_capacity(5_000)
            .time_to_live(std::time::Duration::from_secs(3600))
            .build()
    });

#[derive(Debug, Clone)]
pub struct ParsedUserAgent {
    pub browser: String,
    pub browser_version: Option<String>,
    pub os: String,
    pub os_version: Option<String>,
}

pub fn initialize(ua_regexes_path: &Path) {
    info!("Initializing user agent parser from: {:?}", ua_regexes_path);

    USER_AGENT_PARSER.get_or_init(|| {
        UserAgentParser::builder()
            .with_unicode_support(false)  // Disable unicode since we don't expect any unicode in the user agent
            .with_device(false)          // Disable device parsing since we detect device from screen resolution
            .build_from_yaml(ua_regexes_path.to_str().unwrap_or(""))
            .unwrap_or_else(|e| {
                panic!("Failed to initialize user agent parser from {:?}: {}. Please ensure regexes.yaml is available.", ua_regexes_path, e);
            })
    });

    Lazy::force(&UA_CACHE);
    info!("User agent parser initialization complete");
}

/// Parse a user agent string and return browser, browser_version, and OS information
pub fn parse_user_agent(user_agent: &str) -> ParsedUserAgent {
    debug!("Parsing user agent: {:?}", user_agent);

    if let Some((browser, browser_version, os, os_version)) = UA_CACHE.get(user_agent) {
        debug!(
            "User agent cache hit: browser={:?}, version={:?}, os={:?}, os_version={:?}",
            browser, browser_version, os, os_version
        );
        return ParsedUserAgent {
            browser,
            browser_version,
            os,
            os_version,
        };
    }

    let parser = USER_AGENT_PARSER
        .get()
        .expect("User agent parser not initialized. Call initialize() first.");
    let client = parser.parse(user_agent);

    let browser = client.user_agent.family.to_string();
    let browser_version = client.user_agent.major.map(|v| v.to_string());
    let os = client.os.family.to_string();
    let os_version = client.os.major.map(|v| v.to_string());

    UA_CACHE.insert(
        user_agent.to_string(),
        (
            browser.clone(),
            browser_version.clone(),
            os.clone(),
            os_version.clone(),
        ),
    );

    debug!(
        "User agent parsed: browser={:?}, version={:?}, os={:?}, os_version={:?}",
        browser, browser_version, os, os_version
    );

    ParsedUserAgent {
        browser,
        browser_version,
        os,
        os_version,
    }
}
