use refparser::RefDb;
use std::sync::OnceLock;
use url::{Host, Url};
use std::path::Path;
use tracing::info;
use crate::url_utils::{normalize_url, extract_root_domain};

mod source_categories;
mod sync;

pub use sync::sync_referrer_categories;

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
    /// Canonical source name from the referrer database (e.g. "Google", "LinkedIn")
    pub source_canonical: Option<String>,
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
                source_canonical: None,
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
                source_canonical: None,
                source_name: None,
                search_term: None,
            };
        }
    };
    
    // Local development hosts are not real traffic sources, unless the site itself runs there
    if is_loopback_host(&referrer_url) {
        let is_same_host = match (referrer_url.host_str(), &current_host) {
            (Some(ref_host), Some(curr_host)) => is_internal_referrer(ref_host, curr_host),
            _ => false,
        };
        if !is_same_host {
            return ReferrerInfo::default();
        }
    }

    // Get the parser and lookup the referrer URL.
    // The refparser crate only accepts http/https schemes and matches domains verbatim,
    // so we normalize the URL before lookup:
    // - android-app://com.linkedin.android -> http://com.linkedin.android/
    // - https://www.linkedin.com/feed/     -> http://linkedin.com/feed/
    let parser = get_parser();
    let is_http_scheme = matches!(referrer_url.scheme(), "http" | "https");
    let lookup_url: Option<Url> = if is_http_scheme {
        let host = referrer_url.host_str().unwrap_or("");
        let normalized_host = host.strip_prefix("www.").unwrap_or(host);
        Url::parse(&format!("http://{}{}", normalized_host, referrer_url.path())).ok()
    } else {
        referrer_url
            .host_str()
            .and_then(|h| Url::parse(&format!("http://{}/", h)).ok())
    };
    let referrer_info = lookup_url.as_ref().and_then(|u| parser.lookup(u));
    let source_canonical = referrer_info
        .as_ref()
        .map(|ref_info| ref_info.source.clone())
        .filter(|source| !source.is_empty());

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
    
    let referrer_name = if is_http_scheme {
        referrer_url.host_str().and_then(|h| extract_root_domain(h))
    } else {
        referrer_url.host_str().map(|h| h.to_string())
    };

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
        source_canonical,
        source_name: referrer_name,
        search_term,
    }
}

/// Check if the referrer is internal to the current host
fn is_internal_referrer(referrer_host: &str, current_host: &String) -> bool {
    referrer_host == current_host.as_str()
}

/// Check if the URL's host is loopback: `localhost`, `*.localhost`, `127.0.0.0/8` or `[::1]`
fn is_loopback_host(url: &Url) -> bool {
    match url.host() {
        Some(Host::Domain(domain)) => {
            let domain = domain.trim_end_matches('.').to_ascii_lowercase();
            domain == "localhost" || domain.ends_with(".localhost")
        }
        Some(Host::Ipv4(ip)) => ip.is_loopback(),
        Some(Host::Ipv6(ip)) => ip.is_loopback(),
        None => false,
    }
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


#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn parse(referrer: &str, current_url: &str) -> ReferrerInfo {
        let db_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("assets/snowplow_referers/referers-latest.json");
        initialize(&db_path);
        parse_referrer(Some(referrer), Some(current_url))
    }

    fn assert_direct(info: &ReferrerInfo) {
        assert_eq!(info.source_type, ReferrerSource::Direct);
        assert_eq!(info.url, None);
        assert_eq!(info.source_name, None);
        assert_eq!(info.source_canonical, None);
        assert_eq!(info.search_term, None);
    }

    #[test]
    fn local_referrers_from_another_host_are_direct() {
        for referrer in [
            "http://localhost/",
            "http://localhost:3000/some/page?q=1",
            "http://foo.localhost:3010/dashboard",
            "http://FOO.LocalHost:3010/",
            "http://localhost./",
            "http://127.0.0.1:3000/",
            "http://127.42.0.7/",
            "http://[::1]/",
            "http://[::1]:8080/page",
            "android-app://localhost/",
        ] {
            let info = parse(referrer, "https://betterlytics.io/pricing");
            assert_direct(&info);
        }
    }

    #[test]
    fn local_referrer_from_a_different_local_host_is_direct() {
        assert_direct(&parse("http://foo.localhost:3010/", "http://localhost:3000/"));
        assert_direct(&parse("http://127.0.0.1:3000/", "http://localhost:3000/"));
    }

    #[test]
    fn local_referrer_from_the_same_host_is_internal() {
        let info = parse("http://localhost:3000/about", "http://localhost:3000/");
        assert_eq!(info.source_type, ReferrerSource::Internal);
        assert_eq!(info.url.as_deref(), Some("localhost:3000/about"));

        let info = parse("http://localhost:5173/", "http://localhost:3000/");
        assert_eq!(info.source_type, ReferrerSource::Internal);

        let info = parse("http://foo.localhost:3010/a", "http://foo.localhost:3010/b");
        assert_eq!(info.source_type, ReferrerSource::Internal);

        let info = parse("http://127.0.0.1:3000/", "http://127.0.0.1:8080/");
        assert_eq!(info.source_type, ReferrerSource::Internal);

        let info = parse("http://[::1]:3000/", "http://[::1]/");
        assert_eq!(info.source_type, ReferrerSource::Internal);
    }

    #[test]
    fn look_alike_and_non_loopback_hosts_are_normal_referrers() {
        for referrer in [
            "https://localhost.example.com/",
            "https://notlocalhost.com/",
            "https://localhost-docs.dev/",
            "http://0.0.0.0:3000/",
            "http://192.168.1.10/",
            "http://printer.local/",
        ] {
            let info = parse(referrer, "https://betterlytics.io/");
            assert_eq!(info.source_type, ReferrerSource::Other, "{referrer}");
            assert!(info.url.is_some(), "{referrer}");
            assert!(info.source_name.is_some(), "{referrer}");
        }
    }

    #[test]
    fn non_local_referrers_are_unaffected() {
        let info = parse("https://www.google.com/search?q=analytics", "https://betterlytics.io/");
        assert_eq!(info.source_type, ReferrerSource::Search);
        assert_eq!(info.source_canonical.as_deref(), Some("Google"));

        let info = parse("https://betterlytics.io/docs", "https://betterlytics.io/");
        assert_eq!(info.source_type, ReferrerSource::Internal);

        assert_direct(&parse_referrer(None, Some("https://betterlytics.io/")));
    }
}
