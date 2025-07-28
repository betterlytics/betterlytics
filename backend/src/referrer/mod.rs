use refparser::RefDb;
use std::sync::OnceLock;
use url::Url;
use std::path::Path;
use tracing::info;

/// Referrer source categories
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReferrerSource {
    Direct,
    Search,
    Social,
    Email,
    Internal,
    Other,
}

impl Default for ReferrerSource {
    fn default() -> Self {
        Self::Direct
    }
}

impl ReferrerSource {
    /// Convert the enum to a string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            ReferrerSource::Direct => "direct",
            ReferrerSource::Search => "search",
            ReferrerSource::Social => "social",
            ReferrerSource::Email => "email",
            ReferrerSource::Internal => "internal",
            ReferrerSource::Other => "other",
        }
    }

    /// Convert from referer-parser medium to our ReferrerSource
    fn from_referrer_medium(medium: Option<&str>) -> Self {
        match medium {
            Some("search") => ReferrerSource::Search,
            Some("social") => ReferrerSource::Social,
            Some("internal") => ReferrerSource::Internal,
            Some("email") => ReferrerSource::Email,
            None => ReferrerSource::Direct,
            _ => ReferrerSource::Other,
        }
    }
}

/// Parsed referrer information
#[derive(Debug, Clone, Default)]
pub struct ReferrerInfo {
    /// Original referrer URL
    pub url: Option<String>,
    /// Source category (direct, search, social, etc.)
    pub source_type: ReferrerSource,
    /// Source name (e.g., "Google", "Facebook", etc.)
    pub source_name: Option<String>,
    /// Search term (if available from search engines)
    pub search_term: Option<String>,
}

static PARSER: OnceLock<RefDb> = OnceLock::new();

pub fn initialize(referrer_db_path: &Path) {
    info!("Initializing referrer parser from: {:?}", referrer_db_path);

    PARSER.get_or_init(|| {
        match RefDb::from_json(referrer_db_path.to_str().unwrap_or("")) {
            Ok(db) => db,
            Err(e) => {
                eprintln!("Warning: Could not load referer database from {:?}: {}. Using empty database.", referrer_db_path, e);
                RefDb::default()
            }
        }
    });
}

fn get_parser() -> &'static RefDb {
    PARSER.get().expect("Referrer parser not initialized. Call initialize() first.")
}

/// Sanitize a referrer URL for privacy compliance
/// - For search engines: keeps only search query parameters
/// - For all other sites: strips all query parameters
/// - For all URLs: strips protocol prefixes (http://, https://)
fn sanitize_referrer_url(referrer_url: &Url, is_search_engine: bool, search_params: &[String]) -> String {
    if is_search_engine && !search_params.is_empty() {
        // For search engines, keep only search query parameters
        let mut clean_url = Url::parse(&format!("http://{}{}", 
            referrer_url.host_str().unwrap_or(""), 
            referrer_url.path()
        )).unwrap_or_else(|_| referrer_url.clone());
        
        // Only copy search parameters that are relevant
        for param in search_params {
            if let Some(value) = referrer_url.query_pairs()
                .find(|(key, _)| key == param)
                .map(|(_, val)| val.to_string()) 
            {
                clean_url.query_pairs_mut().append_pair(param, &value);
            }
        }
        
        match normalize_url(&clean_url) {
            Some(normalized) => normalized,
            None => clean_url.to_string()
        }
    } else {
        // For all other URLs, strip query parameters and fragments
        let mut clean_url = referrer_url.clone();
        clean_url.set_query(None);
        clean_url.set_fragment(None);
        
        match normalize_url(&clean_url) {
            Some(normalized) => normalized,
            None => clean_url.to_string()
        }
    }
}

/// Parse a referrer URL and extract useful information
pub fn parse_referrer(referrer: Option<&str>, current_url: Option<&str>) -> ReferrerInfo {
    let current_host = current_url.and_then(|url| {
        Url::parse(url).ok().and_then(|u| u.host_str().map(|h| h.to_string()))
    });
    
    // If no referrer, it's a direct visit
    let referrer_str = match referrer {
        Some(r) if !r.is_empty() => r,
        _ => {
            return ReferrerInfo {
                url: None,
                source_type: ReferrerSource::Direct,
                source_name: None,
                search_term: None,
            }
        }
    };

    let referrer_url = match Url::parse(referrer_str) {
        Ok(url) => url,
        Err(_) => {
            return ReferrerInfo {
                url: Some(referrer_str.to_string()),
                source_type: ReferrerSource::Other,
                source_name: None,
                search_term: None,
            };
        }
    };
    
    // Get the parser and lookup the referrer URL
    let parser = get_parser();
    let referrer_info = parser.lookup(&referrer_url);

    // Determine the source based on refparser result
    let source_type = if let Some(ref_info) = &referrer_info {
        let medium = if ref_info.medium.is_empty() {
            None 
        } else { 
            Some(ref_info.medium.as_str()) 
        };

        ReferrerSource::from_referrer_medium(medium)
    } else {
        // Fallback when the referer-parser doesn't recognize the URL
        // This handles cases where:
        // 1. The referrer is from a domain not in the referrer database
        // 2. Navigation between subdomains of the same site
        // 3. Custom or internal domains within an organization
        // 4. Users who have explicitly set referrer policies to preserve internal referrers
        if let Some(ref_host) = referrer_url.host_str() {
            if let Some(curr_host) = current_host {
                if is_internal_referrer(ref_host, &curr_host) {
                    ReferrerSource::Internal
                } else {
                    ReferrerSource::Other
                }
            } else {
                ReferrerSource::Other
            }
        } else {
            ReferrerSource::Other
        }
    };
    
    // Extract search term if available
    let search_term = if let Some(ref_info) = &referrer_info {
        if ref_info.medium == "search" {
            extract_search_term(&referrer_url, &ref_info.params)
        } else {
            None
        }
    } else {
        None
    };
    
    let referrer_name = referrer_info.as_ref().map(|r| r.source.clone());

    // Determine if this is a search medium and get search parameters
    let (is_search_engine, search_params) = if let Some(ref_info) = &referrer_info {
        (ref_info.medium == "search", &ref_info.params[..])
    } else {
        (false, &[] as &[String])
    };

    // Sanitize the referrer URL to ensure privacy compliance to ensure that the referrer url does not contain any sensitive information
    let sanitized_referrer = sanitize_referrer_url(&referrer_url, is_search_engine, search_params);

    ReferrerInfo {
        url: Some(sanitized_referrer),
        source_type,
        source_name: referrer_name,
        search_term,
    }
}

/// Check if the referrer is internal to the current host
fn is_internal_referrer(referrer_host: &str, current_host: &String) -> bool {
    referrer_host == current_host.as_str()
}

/// Extract search term from URL using parameter names
fn extract_search_term(url: &Url, param_names: &[String]) -> Option<String> {
    let query_pairs = url.query_pairs();
    
    for param in param_names {
        for (key, value) in query_pairs.clone() {
            if key == param.as_str() && !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

/// Strips protocol prefixes (http://, https://, www.) and trailing /
fn normalize_url(url: &Url) -> Option<String> {

    let host = url.host_str()?.trim_start_matches("www.");
    let mut normalized = String::from(host);

    if let Some(port) = url.port() {
        normalized.push_str(&format!(":{}", port));
    }

    let path = url.path().trim_end_matches('/');
    if !path.is_empty() && path != "/" {
        normalized.push_str(path);
    }

    Some(normalized)
}
