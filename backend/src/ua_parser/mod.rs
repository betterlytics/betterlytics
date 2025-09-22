use std::path::Path;

use uaparser::{UserAgentParser, Parser};
use once_cell::sync::Lazy;
use moka::sync::Cache;
use tracing::{info, debug};
use std::sync::OnceLock;

static USER_AGENT_PARSER: OnceLock<UserAgentParser> = OnceLock::new();

static UA_CACHE: Lazy<Cache<String, (String, Option<String>, String)>> = Lazy::new(|| {
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
    
    if let Some((browser, browser_version, os)) = UA_CACHE.get(user_agent) {
        debug!("User agent cache hit: browser={:?}, version={:?}, os={:?}", browser, browser_version, os);
        return ParsedUserAgent {
            browser,
            browser_version,
            os,
        };
    }
    
    let parser = USER_AGENT_PARSER.get().expect("User agent parser not initialized. Call initialize() first.");
    let client = parser.parse(user_agent);

    let browser = canonicalize_browser_family(&client.user_agent.family);
    let browser_version = client.user_agent.major.map(|v| v.to_string());
    let os = client.os.family.to_string();
    
    UA_CACHE.insert(
        user_agent.to_string(),
        (browser.clone(), browser_version.clone(), os.clone())
    );
    
    debug!("User agent parsed: browser={:?}, version={:?}, os={:?}", browser, browser_version, os);
    
    ParsedUserAgent {
        browser,
        browser_version,
        os,
    }
}

/// Normalize/Canonicalize browser family names to a small set of common brands for UI/icon mapping.
/// Examples:
/// - "Chrome Mobile iOS" -> "Chrome"
/// - "Mobile Safari" -> "Safari"
/// - "Firefox Mobile" / "FxiOS" -> "Firefox"
/// - "Microsoft Edge" / "Edg" -> "Edge"
/// - "OPR" / "Opera Mobile" -> "Opera"
fn canonicalize_browser_family(family: &str) -> String {
    let f = family.to_lowercase();

    // Preserve specific Chromium-based brands first
    if f.contains("brave") {
        return "Brave".to_string();
    }
    if f.contains("vivaldi") {
        return "Vivaldi".to_string();
    }
    if f.contains("arc") {
        return "Arc".to_string();
    }

    // Major families
    if f.contains("edg") || f.contains("edge") {
        return "Edge".to_string();
    }
    if f.contains("opr") || f.contains("opera") {
        return "Opera".to_string();
    }
    if f.contains("firefox") || f == "fxios" {
        return "Firefox".to_string();
    }
    if f.contains("safari") {
        return "Safari".to_string();
    }
    if f.contains("chrome") || f.contains("chromium") || f == "crios" {
        return "Chrome".to_string();
    }
    if f.contains("duckduckgo") {
        return "DuckDuckGo".to_string();
    }
    if f.contains("opera") {
        return "Opera".to_string();
    }
    if f.contains("ecosia") {
        return "Ecosia".to_string();
    }

    // Default to original family if no mapping found
    family.to_string()
}