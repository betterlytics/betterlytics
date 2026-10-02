use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr};
use std::sync::OnceLock;
use reqwest::dns::{Addrs, Name, Resolve, Resolving};
use tokio::net::lookup_host;
use url::{Host, Url};

use crate::monitor::ReasonCode;

static ALLOW_PRIVATE_TARGETS: OnceLock<bool> = OnceLock::new();

pub fn init_target_policy(allow_private: bool) {
    let _ = ALLOW_PRIVATE_TARGETS.set(allow_private);
}

pub fn allow_private_targets() -> bool {
    *ALLOW_PRIVATE_TARGETS.get().unwrap_or(&false)
}

#[derive(Debug, Clone)]
pub struct GuardedTarget {
    pub resolved_ip: IpAddr,
}

#[derive(Debug)]
pub struct GuardError {
    pub reason_code: ReasonCode,
    pub message: String,
}

impl GuardError {
    pub fn new(reason_code: ReasonCode, message: impl Into<String>) -> Self {
        Self {
            reason_code,
            message: message.into(),
        }
    }
}

pub const MAX_REDIRECTS: usize = 3;
pub const BODY_STREAM_LIMIT: usize = 32 * 1024;
pub const DEFAULT_PROBE_TIMEOUT_MS: u64 = 3_000;

pub fn get_port(url: &Url) -> u16 {
    url.port_or_known_default().unwrap_or_else(|| {
        match url.scheme() {
            "https" => 443,
            _ => 80,
        }
    })
}

// Keep in sync with dashboard/src/lib/outbound-target.ts
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum IpClass {
    Public,
    Private,
    AlwaysBlocked,
}

const AWS_IMDS_V6: Ipv6Addr = Ipv6Addr::new(0xfd00, 0x0ec2, 0, 0, 0, 0, 0, 0x0254);
const ALIBABA_METADATA: Ipv4Addr = Ipv4Addr::new(100, 100, 100, 200);

fn classify_ip(ip: IpAddr) -> IpClass {
    match ip.to_canonical() {
        IpAddr::V4(v4) => classify_v4(v4),
        IpAddr::V6(v6) => classify_v6(v6),
    }
}

fn classify_v4(v4: Ipv4Addr) -> IpClass {
    let [a, b, _, _] = v4.octets();
    // Link-local holds the AWS/GCP/Azure metadata endpoint; Alibaba's sits inside CGNAT, which the allowance opens.
    // 0.0.0.0 connects to localhost on Linux.
    if v4.is_link_local() || v4 == ALIBABA_METADATA || a == 0 || a >= 224 || v4.is_documentation() {
        IpClass::AlwaysBlocked
    } else if v4.is_loopback() || v4.is_private() || (a == 100 && (b & 0xc0) == 64) {
        // 100.64/10 CGNAT (Tailscale); Ipv4Addr::is_shared is unstable
        IpClass::Private
    } else {
        IpClass::Public
    }
}

fn classify_v6(v6: Ipv6Addr) -> IpClass {
    let s = v6.segments();
    if s[0] == 0x0064 && s[1] == 0xff9b && s[2..6] == [0, 0, 0, 0] {
        // NAT64 64:ff9b::/96 carries an IPv4 target; classify that so DNS64-only hosts keep working
        return classify_v4(Ipv4Addr::from(((s[6] as u32) << 16) | s[7] as u32));
    }
    if v6.is_unicast_link_local() || v6.is_unspecified() || v6.is_multicast() || v6 == AWS_IMDS_V6 {
        IpClass::AlwaysBlocked
    } else if v6.is_loopback() || v6.is_unique_local() {
        IpClass::Private
    } else {
        IpClass::Public
    }
}

fn is_blocked_ip(ip: &IpAddr, allow_private: bool) -> bool {
    match classify_ip(*ip) {
        IpClass::Public => false,
        IpClass::Private => !allow_private,
        IpClass::AlwaysBlocked => true,
    }
}

pub async fn validate_target(url: &Url) -> Result<GuardedTarget, GuardError> {
    let allow_private = allow_private_targets();

    if !is_allowed_scheme(url) {
        return Err(GuardError::new(
            ReasonCode::SchemeBlocked,
            "Only http/https are allowed",
        ));
    }

    if !is_allowed_port(url, allow_private) {
        return Err(GuardError::new(
            ReasonCode::PortBlocked,
            "Only ports 80 and 443 are allowed",
        ));
    }

    let resolved_ip = resolve_ip(url, allow_private).await?;
    Ok(GuardedTarget { resolved_ip })
}

fn is_allowed_scheme(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
}

fn is_allowed_port(url: &Url, allow_private: bool) -> bool {
    allow_private || matches!(get_port(url), 80 | 443)
}

// host_str() keeps IPv6 brackets ("[::1]"), so parsing it as an IpAddr never matches an IPv6
// literal. url::Host also normalises 127.1 and 2130706433 to 127.0.0.1.
fn literal_ip(url: &Url) -> Result<Option<IpAddr>, GuardError> {
    match url.host() {
        Some(Host::Ipv4(v4)) => Ok(Some(IpAddr::V4(v4))),
        Some(Host::Ipv6(v6)) => Ok(Some(IpAddr::V6(v6))),
        Some(Host::Domain(_)) => Ok(None),
        None => Err(GuardError::new(ReasonCode::InvalidHost, "missing host")),
    }
}

async fn resolve_ip(url: &Url, allow_private: bool) -> Result<IpAddr, GuardError> {
    if let Some(ip) = literal_ip(url)? {
        if is_blocked_ip(&ip, allow_private) {
            return Err(GuardError::new(
                ReasonCode::BlockedIpLiteral,
                "target IP is not allowed",
            ));
        }
        return Ok(ip);
    }

    let host = url
        .host_str()
        .ok_or_else(|| GuardError::new(ReasonCode::InvalidHost, "missing host"))?;

    let port = get_port(url);
    let mut addrs = lookup_host((host, port))
        .await
        .map_err(|e| GuardError::new(ReasonCode::DnsError, e.to_string()))?;

    let ip = addrs
        .find(|addr| !is_blocked_ip(&addr.ip(), allow_private))
        .ok_or_else(|| GuardError::new(
            ReasonCode::DnsBlocked,
            "all resolved IPs are blocked",
        ))?
        .ip();

    Ok(ip)
}

/// Connect-time guard for reqwest clients: every DNS answer is filtered, so a
/// rebinding answer between validation and connect is never dialed.
#[derive(Debug, Default, Clone, Copy)]
pub struct GuardedResolver;

impl Resolve for GuardedResolver {
    fn resolve(&self, name: Name) -> Resolving {
        let allow_private = allow_private_targets();
        Box::pin(async move {
            let addrs = resolve_allowed(name.as_str(), allow_private).await?;
            Ok(Box::new(addrs.into_iter()) as Addrs)
        })
    }
}

async fn resolve_allowed(host: &str, allow_private: bool) -> std::io::Result<Vec<SocketAddr>> {
    // reqwest replaces port 0 with the URL's port
    let addrs: Vec<SocketAddr> = lookup_host((host, 0))
        .await?
        .filter(|addr| !is_blocked_ip(&addr.ip(), allow_private))
        .collect();
    if addrs.is_empty() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "all resolved IPs are blocked",
        ));
    }
    Ok(addrs)
}

/// Hostnames are checked by GuardedResolver at connect time; IP literals bypass resolvers, so check them here.
pub fn validate_webhook_url(url: &Url, allow_private: bool) -> Result<(), GuardError> {
    match url.scheme() {
        "https" => {}
        "http" if allow_private => {}
        _ => {
            return Err(GuardError::new(
                ReasonCode::SchemeBlocked,
                "webhook URL scheme not allowed",
            ))
        }
    }
    if let Some(ip) = literal_ip(url)?
        && is_blocked_ip(&ip, allow_private)
    {
        return Err(GuardError::new(
            ReasonCode::BlockedIpLiteral,
            "webhook IP is not allowed",
        ));
    }
    Ok(())
}

pub fn webhook_redirect_policy() -> reqwest::redirect::Policy {
    reqwest::redirect::Policy::custom(|attempt| {
        if attempt.previous().len() > MAX_REDIRECTS {
            attempt.error("too many redirects")
        } else if validate_webhook_url(attempt.url(), allow_private_targets()).is_err() {
            attempt.error("redirect target not allowed")
        } else {
            attempt.follow()
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ip(s: &str) -> IpAddr {
        s.parse().unwrap()
    }

    fn url(s: &str) -> Url {
        Url::parse(s).unwrap()
    }

    #[test]
    fn classifies_public_addresses() {
        for addr in ["1.1.1.1", "2606:4700::1111", "::ffff:1.1.1.1", "64:ff9b::101:101"] {
            assert_eq!(classify_ip(ip(addr)), IpClass::Public, "{addr}");
        }
    }

    #[test]
    fn classifies_private_addresses() {
        for addr in [
            "127.0.0.1",
            "10.1.2.3",
            "172.16.0.1",
            "172.31.255.255",
            "192.168.1.10",
            "100.64.0.1",
            "100.127.255.254",
            "::1",
            "fd12:3456::1",
            "::ffff:127.0.0.1",
        ] {
            assert_eq!(classify_ip(ip(addr)), IpClass::Private, "{addr}");
        }
    }

    #[test]
    fn classifies_always_blocked_addresses() {
        for addr in [
            "169.254.169.254",
            "::ffff:169.254.169.254",
            "64:ff9b::a9fe:a9fe",
            "100.100.100.200",
            "0.0.0.0",
            "0.1.2.3",
            "224.0.0.1",
            "240.0.0.1",
            "255.255.255.255",
            "192.0.2.1",
            "fe80::1",
            "::",
            "ff02::1",
            "fd00:ec2::254",
        ] {
            assert_eq!(classify_ip(ip(addr)), IpClass::AlwaysBlocked, "{addr}");
        }
    }

    #[test]
    fn blocks_by_class_and_allowance() {
        assert!(is_blocked_ip(&ip("10.0.0.1"), false));
        assert!(!is_blocked_ip(&ip("10.0.0.1"), true));
        assert!(is_blocked_ip(&ip("169.254.169.254"), true));
        assert!(!is_blocked_ip(&ip("1.1.1.1"), false));
    }

    #[test]
    fn allows_any_port_only_with_allowance() {
        assert!(!is_allowed_port(&url("http://x:8080/"), false));
        assert!(is_allowed_port(&url("http://x:8080/"), true));
        for allow in [false, true] {
            assert!(is_allowed_port(&url("http://x/"), allow));
            assert!(is_allowed_port(&url("https://x/"), allow));
        }
    }

    #[test]
    fn validates_webhook_urls() {
        let reason = |s: &str, allow: bool| validate_webhook_url(&url(s), allow).unwrap_err().reason_code;

        assert!(validate_webhook_url(&url("https://example.com/"), false).is_ok());
        assert!(validate_webhook_url(&url("https://example.com:8443/"), false).is_ok());
        assert_eq!(reason("http://example.com/", false), ReasonCode::SchemeBlocked);
        assert!(validate_webhook_url(&url("http://example.com/"), true).is_ok());
        assert!(validate_webhook_url(&url("ftp://example.com/"), true).is_err());
        assert_eq!(reason("https://10.0.0.1/", false), ReasonCode::BlockedIpLiteral);
        assert!(validate_webhook_url(&url("https://10.0.0.1/"), true).is_ok());
        assert!(validate_webhook_url(&url("https://169.254.169.254/"), true).is_err());
        assert!(validate_webhook_url(&url("https://[::ffff:127.0.0.1]/"), false).is_err());
        assert_eq!(reason("https://2130706433/", false), ReasonCode::BlockedIpLiteral);
    }

    #[tokio::test]
    async fn resolves_ip_literals_by_allowance() {
        assert_eq!(resolve_ip(&url("http://127.0.0.1:3000/"), true).await.unwrap(), ip("127.0.0.1"));
        assert_eq!(
            resolve_ip(&url("http://127.0.0.1:3000/"), false).await.unwrap_err().reason_code,
            ReasonCode::BlockedIpLiteral
        );
        assert_eq!(resolve_ip(&url("http://[::1]/"), true).await.unwrap(), ip("::1"));
    }

    #[tokio::test]
    async fn guarded_resolution_filters_localhost() {
        assert!(resolve_allowed("localhost", false).await.is_err());
        assert!(!resolve_allowed("localhost", true).await.unwrap().is_empty());
    }
}
