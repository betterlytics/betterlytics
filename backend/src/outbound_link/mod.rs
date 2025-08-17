use url::Url;
use crate::url_utils::clean_and_normalize_url;

/// Outbound link information for analytics tracking
#[derive(Debug, Clone, Default)]
pub struct OutboundLinkInfo {
    /// The cleaned and normalized destination URL
    pub url: String,
    /// The domain extracted from the URL
    pub domain: String,
}

/// Process and clean an outbound link URL for storage
/// 
/// This function:
/// 1. Removes query parameters and fragments for privacy
/// 2. Normalizes the URL (removes www., protocol prefixes)
/// 3. Extracts the domain for categorization
pub fn process_outbound_link(url: &str) -> OutboundLinkInfo {
    let cleaned_url = clean_and_normalize_url(url);
    
    // Extract domain from the original URL for domain categorization
    let domain = extract_domain_from_url(url);
    
    OutboundLinkInfo {
        url: cleaned_url,
        domain,
    }
}

/// Extract the domain from a URL string, removing www. prefix
fn extract_domain_from_url(url: &str) -> String {
    match Url::parse(url) {
        Ok(parsed_url) => {
            if let Some(host) = parsed_url.host_str() {
                host.trim_start_matches("www.").to_string()
            } else {
                "unknown".to_string()
            }
        }
        Err(_) => "unknown".to_string()
    }
}