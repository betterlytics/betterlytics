use psl;
use tracing::debug;
use url::Url;

/// Extracts the root/registrable domain from a full domain string
pub fn extract_root_domain(domain: &str) -> Option<String> {
    let domain_bytes = domain.as_bytes();
    let registrable = psl::domain(domain_bytes)?;
    
    std::str::from_utf8(registrable.as_bytes())
        .ok()
        .map(|s| s.to_lowercase())
}

/// Normalizes a URL by removing protocol, www prefix, and trailing slashes
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

pub fn extract_domain_and_path_from_url(url_str: &str) -> (Option<String>, String) {
    match Url::parse(url_str) {
        Ok(url) => {
            let domain = url.domain().map(|d| d.to_string());
            let path = if url.path().is_empty() {
                "/".to_string()
            } else {
                url.path().to_string()
            };
            (domain, path)
        }
        Err(_) => {
            debug!("Failed to parse URL '{}', treating as path-only", url_str);
            if url_str.starts_with('/') {
                (None, url_str.to_string())
            } else {
                (None, format!("/{}", url_str))
            }
        }
    }
}