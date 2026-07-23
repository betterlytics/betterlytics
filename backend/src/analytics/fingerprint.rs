use sha2::{Digest, Sha256};

use crate::ip_parser::anonymize_ip;
use crate::salt::Salt;

/// Stable visitor attributes hashed into a fingerprint.
pub struct VisitorAttrs<'a> {
    pub ip: &'a str,
    pub device_type: Option<&'a str>,
    pub browser: Option<&'a str>,
    pub browser_version: Option<&'a str>,
    pub os: Option<&'a str>,
    pub root_domain: Option<&'a str>,
}

/// Keyed hash of stable visitor attributes into a u64 fingerprint.
///
/// The secret, daily-rotated `salt` is what makes the result non-reversible: once its
/// rotation window passes the salt is discarded, so a stored fingerprint can no longer be
/// traced back to an IP.
pub fn generate_fingerprint(salt: &Salt, attrs: &VisitorAttrs) -> u64 {
    let anonymized_ip = anonymize_ip(attrs.ip).unwrap_or_else(|| "unknown".to_string());
    let device_category = attrs.device_type.unwrap_or("unknown").to_lowercase();
    let browser_family = attrs.browser.unwrap_or("unknown").to_lowercase();
    let browser_major_version = attrs.browser_version.unwrap_or("unknown").to_string();
    let os_family = attrs.os.unwrap_or("unknown").to_lowercase();
    let domain = attrs.root_domain.unwrap_or("unknown").to_lowercase();

    let mut hasher = Sha256::new();
    hasher.update(salt.as_slice());
    hasher.update(format!(
        "{}:{}:{}:{}:{}:{}",
        anonymized_ip,
        device_category,
        browser_family,
        browser_major_version,
        os_family,
        domain
    ));

    let result = hasher.finalize();
    u64::from_be_bytes(result[..8].try_into().expect("always produces 32 bytes"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn attrs() -> VisitorAttrs<'static> {
        VisitorAttrs {
            ip: "192.168.1.123",
            device_type: Some("desktop"),
            browser: Some("Chrome"),
            browser_version: Some("120"),
            os: Some("Windows"),
            root_domain: Some("example.com"),
        }
    }

    #[test]
    fn same_salt_and_attrs_are_deterministic() {
        let salt = [7u8; 16];
        assert_eq!(
            generate_fingerprint(&salt, &attrs()),
            generate_fingerprint(&salt, &attrs())
        );
    }

    #[test]
    fn different_salt_changes_fingerprint() {
        assert_ne!(
            generate_fingerprint(&[1u8; 16], &attrs()),
            generate_fingerprint(&[2u8; 16], &attrs())
        );
    }

    #[test]
    fn changed_attribute_changes_fingerprint() {
        let salt = [7u8; 16];
        let base = generate_fingerprint(&salt, &attrs());
        let changed = VisitorAttrs {
            browser: Some("Firefox"),
            ..attrs()
        };
        assert_ne!(base, generate_fingerprint(&salt, &changed));
    }
}