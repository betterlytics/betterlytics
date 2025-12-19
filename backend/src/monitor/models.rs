use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::net::Ipv6Addr;
use std::time::Duration;
use url::Url;

/// Represents an accepted status code - either a specific code (200) or a range ("2xx")
#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum StatusCodeValue {
    Specific(i32),
    Range(String),
}

impl StatusCodeValue {
    /// Check if a given status code matches this value
    pub fn matches(&self, code: u16) -> bool {
        match self {
            StatusCodeValue::Specific(specific) => *specific == code as i32,
            StatusCodeValue::Range(range) => {
                // Parse ranges like "2xx", "3xx", "4xx", "5xx"
                if range.len() == 3 && range.ends_with("xx") {
                    if let Some(prefix) = range.chars().next().and_then(|c| c.to_digit(10)) {
                        let range_start = (prefix * 100) as u16;
                        let range_end = range_start + 99;
                        return code >= range_start && code <= range_end;
                    }
                }
                false
            }
        }
    }
}

/// Check if a status code is accepted by any of the configured values
pub fn is_status_code_accepted(code: u16, accepted: &[StatusCodeValue]) -> bool {
    // If no codes configured, default to accepting 2xx
    if accepted.is_empty() {
        return (200..300).contains(&code);
    }
    accepted.iter().any(|v| v.matches(code))
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReasonCode {
    Ok,
    TlsHandshakeFailed,
    TlsMissingCertificate,
    TlsExpired,
    TlsExpiringSoon,
    TlsParseError,
    Http4xx,
    Http5xx,
    HttpOther,
    HttpTimeout,
    HttpConnectError,
    HttpBodyError,
    HttpRequestError,
    HttpError,
    TooManyRedirects,
    RedirectJoinFailed,
    SchemeBlocked,
    PortBlocked,
    InvalidHost,
    BlockedIpLiteral,
    DnsBlocked,
    DnsError,
}

impl ReasonCode {
    pub const fn as_str(&self) -> &'static str {
        match self {
            ReasonCode::Ok => "ok",
            ReasonCode::TlsHandshakeFailed => "tls_handshake_failed",
            ReasonCode::TlsMissingCertificate => "tls_missing_certificate",
            ReasonCode::TlsExpired => "tls_expired",
            ReasonCode::TlsExpiringSoon => "tls_expiring_soon",
            ReasonCode::TlsParseError => "tls_parse_error",
            ReasonCode::Http4xx => "http_4xx",
            ReasonCode::Http5xx => "http_5xx",
            ReasonCode::HttpOther => "http_other",
            ReasonCode::HttpTimeout => "http_timeout",
            ReasonCode::HttpConnectError => "http_connect_error",
            ReasonCode::HttpBodyError => "http_body_error",
            ReasonCode::HttpRequestError => "http_request_error",
            ReasonCode::HttpError => "http_error",
            ReasonCode::TooManyRedirects => "too_many_redirects",
            ReasonCode::RedirectJoinFailed => "redirect_join_failed",
            ReasonCode::SchemeBlocked => "scheme_blocked",
            ReasonCode::PortBlocked => "port_blocked",
            ReasonCode::InvalidHost => "invalid_host",
            ReasonCode::BlockedIpLiteral => "blocked_ip_literal",
            ReasonCode::DnsBlocked => "dns_blocked",
            ReasonCode::DnsError => "dns_error",
        }
    }

    /// Returns a human-readable message for this reason code.
    pub const fn to_message(&self) -> &'static str {
        match self {
            ReasonCode::Ok => "Site is healthy",
            ReasonCode::TlsHandshakeFailed => "SSL/TLS handshake failed",
            ReasonCode::TlsMissingCertificate => "SSL certificate not found",
            ReasonCode::TlsExpired => "SSL certificate has expired",
            ReasonCode::TlsExpiringSoon => "SSL certificate expiring soon",
            ReasonCode::TlsParseError => "Failed to parse SSL certificate",
            ReasonCode::Http4xx => "Server returned a client error",
            ReasonCode::Http5xx => "Server returned a server error",
            ReasonCode::HttpOther => "Unexpected HTTP status code",
            ReasonCode::HttpTimeout => "Request timed out",
            ReasonCode::HttpConnectError => "Could not connect to server",
            ReasonCode::HttpBodyError => "Error reading response body",
            ReasonCode::HttpRequestError => "Error sending request",
            ReasonCode::HttpError => "HTTP request failed",
            ReasonCode::TooManyRedirects => "Too many redirects",
            ReasonCode::RedirectJoinFailed => "Invalid redirect location",
            ReasonCode::SchemeBlocked => "URL scheme not allowed",
            ReasonCode::PortBlocked => "Port not allowed",
            ReasonCode::InvalidHost => "Invalid hostname",
            ReasonCode::BlockedIpLiteral => "IP address not allowed",
            ReasonCode::DnsBlocked => "DNS resolved to blocked address",
            ReasonCode::DnsError => "DNS resolution failed",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "ok" => Some(ReasonCode::Ok),
            "tls_handshake_failed" => Some(ReasonCode::TlsHandshakeFailed),
            "tls_missing_certificate" => Some(ReasonCode::TlsMissingCertificate),
            "tls_expired" => Some(ReasonCode::TlsExpired),
            "tls_expiring_soon" => Some(ReasonCode::TlsExpiringSoon),
            "tls_parse_error" => Some(ReasonCode::TlsParseError),
            "http_4xx" => Some(ReasonCode::Http4xx),
            "http_5xx" => Some(ReasonCode::Http5xx),
            "http_other" => Some(ReasonCode::HttpOther),
            "http_timeout" => Some(ReasonCode::HttpTimeout),
            "http_connect_error" => Some(ReasonCode::HttpConnectError),
            "http_body_error" => Some(ReasonCode::HttpBodyError),
            "http_request_error" => Some(ReasonCode::HttpRequestError),
            "http_error" => Some(ReasonCode::HttpError),
            "too_many_redirects" => Some(ReasonCode::TooManyRedirects),
            "redirect_join_failed" => Some(ReasonCode::RedirectJoinFailed),
            "scheme_blocked" => Some(ReasonCode::SchemeBlocked),
            "port_blocked" => Some(ReasonCode::PortBlocked),
            "invalid_host" => Some(ReasonCode::InvalidHost),
            "blocked_ip_literal" => Some(ReasonCode::BlockedIpLiteral),
            "dns_blocked" => Some(ReasonCode::DnsBlocked),
            "dns_error" => Some(ReasonCode::DnsError),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum HttpMethod {
    Head,
    Get,
}

impl HttpMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            HttpMethod::Head => "HEAD",
            HttpMethod::Get => "GET",
        }
    }
}

impl Default for HttpMethod {
    fn default() -> Self {
        HttpMethod::Head
    }
}

#[derive(Clone, Debug)]
pub struct RequestHeader {
    pub key: String,
    pub value: String,
}

/// Alert configuration embedded in MonitorCheck
#[derive(Clone, Debug, Default)]
pub struct AlertConfig {
    pub enabled: bool,
    pub on_down: bool,
    pub on_recovery: bool,
    pub on_ssl_expiry: bool,
    pub ssl_expiry_days: i32,
    pub failure_threshold: i32,
    pub recipients: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct MonitorCheck {
    pub id: String,
    pub dashboard_id: String,
    pub site_id: String,
    pub name: Option<String>,
    pub url: Url,
    pub interval: Duration,
    pub timeout: Duration,
    pub updated_at: DateTime<Utc>,
    pub http_method: HttpMethod,
    pub request_headers: Vec<RequestHeader>,
    pub accepted_status_codes: Vec<StatusCodeValue>,
    pub check_ssl_errors: bool,
    /// Alert configuration for this monitor
    pub alert: AlertConfig,
}

#[derive(Debug, Clone, Copy, Serialize_repr, Deserialize_repr, PartialEq, Eq)]
#[repr(i8)]
pub enum MonitorStatus {
    Ok = 1,
    Warn = 2,
    Down = 3,
    Error = 4,
}

/// Reason for monitor backoff state.
/// Note: `Manual` and `RateLimited` variants exist in the database schema
/// and are reserved for future use.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum BackoffReason {
    None = 0,
    Failure = 1,
    /// Reserved for future use - exists in DB schema
    Manual = 2,
    /// Reserved for future use - exists in DB schema
    RateLimited = 3,
}

#[derive(Debug, Clone)]
pub struct BackoffSnapshot {
    pub effective_interval: Duration,
    pub backoff_level: u8,
    pub consecutive_failures: u16,
    pub consecutive_successes: u16,
    pub backoff_reason: BackoffReason,
}

impl BackoffSnapshot {
    pub fn from_base_interval(interval: Duration) -> Self {
        Self {
            effective_interval: interval,
            backoff_level: 0,
            consecutive_failures: 0,
            consecutive_successes: 0,
            backoff_reason: BackoffReason::None,
        }
    }

    pub fn effective_interval_seconds(&self) -> u16 {
        self.effective_interval
            .as_secs()
            .min(u16::MAX as u64) as u16
    }
}

#[derive(Debug, Clone)]
pub struct ProbeOutcome {
    pub success: bool,
    pub status: MonitorStatus,
    pub status_code: Option<u16>,
    pub latency: Duration,
    pub reason_code: ReasonCode,
    pub resolved_ip: Option<Ipv6Addr>,
    pub tls_not_after: Option<DateTime<Utc>>,
    pub tls_days_left: Option<i32>,
    pub final_url: Option<String>,
    pub redirect_hops: usize,
    pub body_truncated: bool,
}

impl ProbeOutcome {
    pub fn success(latency: Duration, status_code: Option<u16>, resolved_ip: Ipv6Addr) -> Self {
        Self {
            success: true,
            status: MonitorStatus::Ok,
            status_code,
            latency,
            reason_code: ReasonCode::Ok,
            resolved_ip: Some(resolved_ip),
            tls_not_after: None,
            tls_days_left: None,
            final_url: None,
            redirect_hops: 0,
            body_truncated: false,
        }
    }

    pub fn failure(
        latency: Duration,
        status_code: Option<u16>,
        reason_code: ReasonCode,
    ) -> Self {
        Self {
            success: false,
            status: MonitorStatus::Down,
            status_code,
            latency,
            reason_code,
            resolved_ip: None,
            tls_not_after: None,
            tls_days_left: None,
            final_url: None,
            redirect_hops: 0,
            body_truncated: false,
        }
    }
}

#[derive(clickhouse::Row, Serialize, Debug, Clone)]
pub struct MonitorResultRow {
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    pub ts: DateTime<Utc>,
    pub check_id: String,
    pub site_id: String,
    pub kind: String,
    pub status: MonitorStatus,
    pub reason_code: String,
    pub latency_ms: Option<f64>,
    pub status_code: Option<u16>,
    pub http_method: String,
    pub resolved_ip: Option<Ipv6Addr>,
    pub port: Option<u16>,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis::option")]
    pub tls_not_after: Option<DateTime<Utc>>,
    pub tls_days_left: Option<i32>,
    pub effective_interval_seconds: u16,
    pub backoff_level: u8,
    pub consecutive_failures: u16,
    pub consecutive_successes: u16,
    pub backoff_reason: BackoffReason,
    pub extra: String,
}

impl MonitorResultRow {
    pub fn from_probe(
        check: &MonitorCheck,
        outcome: &ProbeOutcome,
        backoff: &BackoffSnapshot,
    ) -> Self {
        let kind = if check.url.scheme() == "https" { "https" } else { "http" };
        let status = outcome.status;

        Self {
            ts: Utc::now(),
            check_id: check.id.clone(),
            site_id: check.site_id.clone(),
            kind: kind.to_string(),
            status,
            reason_code: outcome.reason_code.as_str().to_string(),
            latency_ms: Some(outcome.latency.as_secs_f64() * 1000.0),
            status_code: outcome.status_code,
            http_method: check.http_method.as_str().to_string(),
            resolved_ip: outcome.resolved_ip,
            port: check.url.port_or_known_default(),
            tls_not_after: outcome.tls_not_after,
            tls_days_left: outcome.tls_days_left,
            effective_interval_seconds: backoff.effective_interval_seconds(),
            backoff_level: backoff.backoff_level,
            consecutive_failures: backoff.consecutive_failures,
            consecutive_successes: backoff.consecutive_successes,
            backoff_reason: backoff.backoff_reason,
            extra: serde_json::json!({
                "redirect_hops": outcome.redirect_hops,
                "final_url": outcome.final_url,
                "body_truncated": outcome.body_truncated,
            })
            .to_string(),
        }
    }

    pub fn from_tls_probe(check: &MonitorCheck, outcome: &ProbeOutcome) -> Self {
        let backoff = BackoffSnapshot::from_base_interval(check.interval);
        Self {
            ts: Utc::now(),
            check_id: check.id.clone(),
            site_id: check.site_id.clone(),
            kind: "tls".to_string(),
            status: outcome.status,
            reason_code: outcome.reason_code.as_str().to_string(),
            latency_ms: Some(outcome.latency.as_secs_f64() * 1000.0),
            status_code: None,
            http_method: String::new(), // TLS probes don't use HTTP methods
            resolved_ip: outcome.resolved_ip,
            port: check.url.port_or_known_default(),
            tls_not_after: outcome.tls_not_after,
            tls_days_left: outcome.tls_days_left,
            effective_interval_seconds: backoff.effective_interval_seconds(),
            backoff_level: backoff.backoff_level,
            consecutive_failures: backoff.consecutive_failures,
            consecutive_successes: backoff.consecutive_successes,
            backoff_reason: backoff.backoff_reason,
            extra: String::new(),
        }
    }

}
