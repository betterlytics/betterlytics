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

/// Returns the domain of a url string:
pub fn get_domain(url_str: &str) -> String {
    match Url::parse(url_str) {
        Ok(parsed_url) => {
            let parsed_domain = parsed_url.domain();
            match parsed_domain {
                Some(domain) => domain.trim_start_matches("www.").to_string(),
                None => parsed_url.to_string()
            }
        }
        Err(_) => {
            // If URL parsing fails, return as-is (validation should catch this earlier)
            url_str.to_string()
        }
    }
}
