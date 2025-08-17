use url::Url;

/// Normalizes a URL by removing protocol, www prefix, and trailing slashes
/// Used for both referrer URLs and outbound link URLs for consistent data storage
/// 
/// Examples:
/// - "https://www.example.com/path/" -> "example.com/path"  
/// - "http://subdomain.example.com/page" -> "subdomain.example.com/page"
pub fn normalize_url(url: &Url) -> Option<String> {
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

/// Cleans and normalizes a URL string by:
/// 1. Removing query parameters and fragments for privacy
/// 2. Normalizing the host (removing www. prefix)  
/// 3. Removing protocol prefixes
pub fn clean_and_normalize_url(url_str: &str) -> String {
    match Url::parse(url_str) {
        Ok(mut parsed_url) => {
            // Remove query params and fragments for privacy
            parsed_url.set_query(None);
            parsed_url.set_fragment(None);
            
            // Normalize and return clean URL
            match normalize_url(&parsed_url) {
                Some(normalized) => normalized,
                None => parsed_url.to_string()
            }
        }
        Err(_) => {
            // If URL parsing fails, return as-is (validation should catch this earlier)
            url_str.to_string()
        }
    }
}