use std::net::{IpAddr, Ipv6Addr};
use std::sync::OnceLock;
use tokio::net::lookup_host;
use url::Url;

use crate::monitor::ReasonCode;

/// Global development mode flag - when true, allows localhost/private IPs for monitoring
static DEV_MODE: OnceLock<bool> = OnceLock::new();

/// In dev mode, localhost and private IPs are allowed as monitoring targets.
pub fn init_dev_mode(is_dev: bool) {
    let _ = DEV_MODE.set(is_dev);
    if is_dev {
        tracing::info!("Monitor guard: development mode enabled - localhost targets allowed");
    }
}

fn is_dev_mode() -> bool {
    *DEV_MODE.get().unwrap_or(&false)
}

#[derive(Debug, Clone)]
pub struct GuardedTarget {
    pub resolved_ip: Ipv6Addr,
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
pub const MAX_RESPONSE_BYTES: usize = 32 * 1024; // 32KB cap on bodies
pub const DEFAULT_PROBE_TIMEOUT_MS: u64 = 3_000;

pub async fn validate_target(url: &Url) -> Result<GuardedTarget, GuardError> {
    if !is_allowed_scheme(url) {
        return Err(GuardError::new(
            ReasonCode::SchemeBlocked,
            "Only http/https are allowed",
        ));
    }

    if !is_allowed_port(url) {
        return Err(GuardError::new(
            ReasonCode::PortBlocked,
            "Only ports 80 and 443 are allowed",
        ));
    }

    let resolved_ip = resolve_ip(url).await?;
    Ok(GuardedTarget { resolved_ip })
}

fn is_allowed_scheme(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
}

fn is_allowed_port(url: &Url) -> bool {
    if is_dev_mode() {
        return true;
    }

    matches!(url.port_or_known_default().unwrap_or(80), 80 | 443)
}

async fn resolve_ip(url: &Url) -> Result<Ipv6Addr, GuardError> {
    let host = url
        .host_str()
        .ok_or_else(|| GuardError::new(ReasonCode::InvalidHost, "missing host"))?;

    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_blocked_ip(&ip) {
            return Err(GuardError::new(
                ReasonCode::BlockedIpLiteral,
                "target IP is not allowed",
            ));
        }
        return Ok(ip_to_v6(ip));
    }

    let port = url.port_or_known_default().unwrap_or(80);
    let mut addrs = lookup_host((host, port))
        .await
        .map_err(|e| GuardError::new(ReasonCode::DnsError, e.to_string()))?;

    let ip = addrs
        .find(|addr| !is_blocked_ip(&addr.ip()))
        .ok_or_else(|| GuardError::new(
            ReasonCode::DnsBlocked,
            "all resolved IPs are blocked",
        ))?
        .ip();

    Ok(ip_to_v6(ip))
}

fn is_blocked_ip(ip: &IpAddr) -> bool {
    if is_dev_mode() {
        return false;
    }

    match ip {
        IpAddr::V4(v4) => {
            v4.is_private()
                || v4.is_link_local()
                || v4.is_loopback()
                || v4.is_broadcast()
                || v4.is_documentation()
                || v4.is_unspecified()
        }
        IpAddr::V6(v6) => {
            v6.is_loopback()
                || v6.is_unique_local()
                || v6.is_unspecified()
                || v6.is_multicast()
                || v6.is_unicast_link_local()
        }
    }
}

fn ip_to_v6(ip: IpAddr) -> Ipv6Addr {
    match ip {
        IpAddr::V4(v4) => v4.to_ipv6_mapped(),
        IpAddr::V6(v6) => v6,
    }
}
