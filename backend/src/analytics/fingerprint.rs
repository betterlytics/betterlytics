use std::net::IpAddr;
use chrono::{Utc, Datelike};
use md5::Digest;
use sha2::Sha256;

/// Anonymize IP address by removing last octet
fn anonymize_ip(ip: &str) -> Option<String> {
    if let Ok(ip_addr) = ip.parse::<IpAddr>() {
        match ip_addr {
            IpAddr::V4(ipv4) => {
                let octets = ipv4.octets();
                Some(format!("{}.{}.{}.0", octets[0], octets[1], octets[2]))
            },
            IpAddr::V6(ipv6) => {
                // For IPv6, we'll use the first 64 bits (8 bytes)
                let segments = ipv6.segments();
                Some(format!("{:x}:{:x}:{:x}:{:x}::", 
                    segments[0], segments[1], segments[2], segments[3]))
            }
        }
    } else {
        None
    }
}

/// Generate a daily salt based on the current date
fn generate_daily_salt() -> String {
    let now = Utc::now();
    format!("{}-{}-{}", now.year(), now.month(), now.day())
}

/// Uses: anonymized IP + device type + browser family + major version + OS family + root domain + daily salt
pub fn generate_fingerprint(
    ip: &str, 
    device_type: Option<&str>,
    browser: Option<&str>,
    browser_version: Option<&str>, 
    os: Option<&str>,
    root_domain: Option<&str>,
) -> String {
    let anonymized_ip = anonymize_ip(ip).unwrap_or_else(|| "unknown".to_string());
    let device_category = device_type.unwrap_or("unknown").to_lowercase();
    let browser_family = browser.unwrap_or("unknown").to_lowercase();
    let browser_major_version = browser_version.unwrap_or("unknown").to_string();
    let os_family = os.unwrap_or("unknown").to_lowercase();
    let domain = root_domain.unwrap_or("unknown").to_lowercase();
    
    let daily_salt = generate_daily_salt();
    
    let mut hasher = Sha256::new();
    hasher.update(format!(
        "{}:{}:{}:{}:{}:{}:{}",
        anonymized_ip,
        device_category,
        browser_family,
        browser_major_version,
        os_family,
        domain,
        daily_salt
    ));
    
    let result = hasher.finalize();
    format!("{:x}", result)
}