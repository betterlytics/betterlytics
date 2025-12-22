use std::net::SocketAddr;
use std::time::Duration;

use chrono::{DateTime, TimeZone, Utc};
use futures::StreamExt;
use reqwest::{Client, StatusCode, redirect::Policy, tls::Version};
use rustls_native_certs::load_native_certs;
use std::sync::{Arc, OnceLock};
use tokio::time::Instant;
use tokio_rustls::client::TlsStream;
use tokio_rustls::TlsConnector;
use tokio_rustls::rustls::{ClientConfig, RootCertStore, CertificateError, Error as RustlsError};
use tokio_rustls::rustls::pki_types::ServerName;
use tracing::{debug, warn};
use url::Url;
use x509_parser::prelude::FromDer;

use crate::monitor::guard::{GuardError, MAX_REDIRECTS, MAX_RESPONSE_BYTES, validate_target};
use crate::monitor::models::{HttpMethod, MonitorStatus, StatusCodeValue, is_status_code_accepted};
use crate::monitor::{MonitorCheck, ProbeOutcome, ReasonCode};

#[derive(Debug, Clone)]
struct ProbeError {
    reason_code: ReasonCode,
    message: String,
}

impl ProbeError {
    fn new(reason_code: ReasonCode, message: impl Into<String>) -> Self {
        Self {
            reason_code,
            message: message.into(),
        }
    }
}

impl From<GuardError> for ProbeError {
    fn from(value: GuardError) -> Self {
        Self::new(value.reason_code, value.message)
    }
}

#[derive(Clone, Debug)]
struct CappedResponse {
    status: StatusCode,
    headers: reqwest::header::HeaderMap,
    content_length: Option<u64>,
    body_truncated: bool,
}

impl CappedResponse {
    fn new(
        status: StatusCode,
        headers: reqwest::header::HeaderMap,
        content_length: Option<u64>,
        body_truncated: bool,
    ) -> Self {
        Self {
            status,
            headers,
            content_length,
            body_truncated,
        }
    }
}

#[derive(Clone)]
pub struct MonitorProbe {
    client: Client,
}

impl MonitorProbe {
    pub fn new(default_timeout: Duration) -> anyhow::Result<Self> {
        let client = Client::builder()
            .user_agent("betterlytics-monitor/0.1")
            .pool_max_idle_per_host(8)
            .tcp_keepalive(Some(Duration::from_secs(30)))
            .timeout(default_timeout)
            .min_tls_version(Version::TLS_1_2)
            // We handle redirects manually to validate each hop and DNS result.
            .redirect(Policy::none())
            .build()?;

        Ok(Self { client })
    }

    pub async fn run(&self, check: &MonitorCheck) -> ProbeOutcome {
        let start = Instant::now();
        let response = self.follow_with_guards(check).await;

        let latency = start.elapsed();

        match response {
            Ok((resp, resolved_ip, final_url, redirect_hops)) => self.http_outcome(
                latency,
                resp,
                resolved_ip,
                final_url,
                redirect_hops,
                &check.accepted_status_codes,
            ),
            Err(error) => self.http_failure(latency, check, error),
        }
    }

    pub async fn run_tls(&self, check: &MonitorCheck) -> ProbeOutcome {
        let start = Instant::now();

        if check.url.scheme() != "https" {
            return self
                .tls_error_outcome(start.elapsed(), ReasonCode::SchemeBlocked);
        }

        let guard = match validate_target(&check.url).await {
            Ok(guard) => guard,
            Err(err) => {
                return self.tls_error_outcome(start.elapsed(), err.reason_code);
            }
        };

        match self
            .direct_rustls_not_after(&check.url, check.timeout, guard.resolved_ip)
            .await
        {
            Ok(not_after) => {
                let latency = start.elapsed();
                let days_left = (not_after - Utc::now()).num_days() as i32;
                let mut outcome = ProbeOutcome::success(latency, None, guard.resolved_ip);
                outcome.tls_not_after = Some(not_after);
                outcome.tls_days_left = Some(days_left);

                let (status, reason_code) = if days_left < 0 {
                    (MonitorStatus::Down, ReasonCode::TlsExpired)
                } else if days_left <= check.alert.ssl_expiry_days {
                    (MonitorStatus::Warn, ReasonCode::TlsExpiringSoon)
                } else {
                    (MonitorStatus::Ok, ReasonCode::Ok)
                };

                outcome.status = status;
                outcome.reason_code = reason_code;
                outcome.success = !matches!(status, MonitorStatus::Down | MonitorStatus::Error);
                outcome
            }
            Err(err) => {
                let latency = start.elapsed();
                self.tls_failure(latency, check, err)
            }
        }
    }
}

pub const DEFAULT_PROBE_TIMEOUT_MS: u64 = crate::monitor::guard::DEFAULT_PROBE_TIMEOUT_MS;

impl MonitorProbe {
    fn http_outcome(
        &self,
        latency: Duration,
        resp: CappedResponse,
        resolved_ip: std::net::IpAddr,
        final_url: String,
        redirect_hops: usize,
        accepted_status_codes: &[StatusCodeValue],
    ) -> ProbeOutcome {
        let status = resp.status;
        let status_code = status.as_u16();
        
        // Check if status code is accepted (uses configured codes, defaults to 2xx if empty)
        let is_accepted = is_status_code_accepted(status_code, accepted_status_codes);
        
        if is_accepted {
            let mut outcome = ProbeOutcome::success(latency, Some(status_code), resolved_ip);
            outcome.final_url = Some(final_url);
            outcome.redirect_hops = redirect_hops;
            outcome.body_truncated = resp.body_truncated
                || resp
                    .content_length
                    .map(|len| len > MAX_RESPONSE_BYTES as u64)
                    .unwrap_or(false);
            return outcome;
        }

        let reason_code = if status.is_client_error() {
            ReasonCode::Http4xx
        } else if status.is_server_error() {
            ReasonCode::Http5xx
        } else {
            ReasonCode::HttpOther
        };
        ProbeOutcome::failure(latency, Some(status_code), reason_code)
    }

    fn http_failure(
        &self,
        latency: Duration,
        check: &MonitorCheck,
        error: ProbeError,
    ) -> ProbeOutcome {
        debug!(
            check = %check.id,
            reason = %error.reason_code.as_str(),
            error = %error.message,
            "probe request failed"
        );
        ProbeOutcome::failure(
            latency,
            None,
            error.reason_code,
        )
    }

    fn tls_error_outcome(
        &self,
        latency: Duration,
        reason_code: ReasonCode,
    ) -> ProbeOutcome {
        let mut outcome =
            ProbeOutcome::failure(latency, None, reason_code);
        outcome.status = MonitorStatus::Error;
        outcome
    }

    fn tls_failure(
        &self,
        latency: Duration,
        check: &MonitorCheck,
        err: ProbeError,
    ) -> ProbeOutcome {
        debug!(
            check = %check.id,
            reason = %err.reason_code.as_str(),
            error = %err.message,
            "tls probe handshake failed"
        );
        self.tls_error_outcome(latency, err.reason_code)
    }

    async fn follow_with_guards(
        &self,
        check: &MonitorCheck,
    ) -> Result<(CappedResponse, std::net::IpAddr, String, usize), ProbeError> {
        let mut current_url = check.url.clone();
        let mut resolved_ip = validate_target(&current_url).await.map_err(ProbeError::from)?.resolved_ip;

        for hop in 0..=MAX_REDIRECTS {
            let response = self.request_with_method(check, &current_url).await?;
            let status = response.status;

            if !status.is_redirection() {
                return Ok((response, resolved_ip, current_url.to_string(), hop));
            }

            let location = response
                .headers
                .get(reqwest::header::LOCATION)
                .and_then(|v| v.to_str().ok());

            let Some(location) = location else {
                return Ok((response, resolved_ip, current_url.to_string(), hop));
            };

            if hop >= MAX_REDIRECTS {
                return Err(ProbeError::new(
                    ReasonCode::TooManyRedirects,
                    "exceeded redirect limit",
                ));
            }

            let next_url = match current_url.join(location) {
                Ok(u) => u,
                Err(_) => {
                    return Err(ProbeError::new(
                        ReasonCode::RedirectJoinFailed,
                        "failed to resolve redirect location",
                    ));
                }
            };

            resolved_ip = validate_target(&next_url).await.map_err(ProbeError::from)?.resolved_ip;

            current_url = next_url;
        }

        Err(ProbeError::new(
            ReasonCode::TooManyRedirects,
            "exceeded redirect limit",
        ))
    }

    async fn request_with_method(
        &self,
        check: &MonitorCheck,
        url: &Url,
    ) -> Result<CappedResponse, ProbeError> {
        let timeout = check.timeout;
        
        match check.http_method {
            HttpMethod::Get => {
                self.request_get_capped(url, timeout, &check.request_headers).await
            }
            HttpMethod::Head => {
                self.request_head(url, timeout, &check.request_headers).await
            }
        }
    }
    
    async fn request_head(
        &self,
        url: &Url,
        timeout: Duration,
        request_headers: &[crate::monitor::RequestHeader],
    ) -> Result<CappedResponse, ProbeError> {
        let request = self.client.head(url.clone()).timeout(timeout);
        let request = apply_custom_headers(request, request_headers);
        let resp = request.send().await.map_err(map_reqwest_error)?;

        let status = resp.status();
        let headers = resp.headers().clone();
        let content_length = resp.content_length();
        let body_truncated = matches!(content_length, Some(len) if len > MAX_RESPONSE_BYTES as u64);

        Ok(CappedResponse::new(
            status,
            headers,
            content_length,
            body_truncated,
        ))
    }

    async fn request_get_capped(
        &self,
        url: &Url,
        timeout: Duration,
        request_headers: &[crate::monitor::RequestHeader],
    ) -> Result<CappedResponse, ProbeError> {
        let request = self.client.get(url.clone()).timeout(timeout);
        let request = apply_custom_headers(request, request_headers);
        let resp = request.send().await.map_err(map_reqwest_error)?;

        let status = resp.status();
        let headers = resp.headers().clone();

        if let Some(len) = resp.content_length() {
            let body_truncated = len > MAX_RESPONSE_BYTES as u64;
            return Ok(CappedResponse::new(status, headers, Some(len), body_truncated));
        }

        if status.is_redirection() {
            // Don't bother streaming redirect bodies; headers are all we need.
            return Ok(CappedResponse::new(status, headers, None, false));
        }

        let mut read_bytes: usize = 0;
        let mut stream = resp.bytes_stream();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(map_reqwest_error)?;
            read_bytes += chunk.len();
            if read_bytes > MAX_RESPONSE_BYTES {
                return Ok(CappedResponse::new(
                    status,
                    headers,
                    Some(read_bytes as u64),
                    true,
                ));
            }
        }

        Ok(CappedResponse::new(
            status,
            headers,
            Some(read_bytes as u64),
            false,
        ))
    }

    async fn direct_rustls_not_after(
        &self,
        url: &Url,
        timeout: Duration,
        resolved_ip: std::net::IpAddr,
    ) -> Result<DateTime<Utc>, ProbeError> {
        let host = url
            .host_str()
            .ok_or_else(|| ProbeError::new(ReasonCode::InvalidHost, "missing host for tls"))?;
        let port = url.port_or_known_default().unwrap_or(443);

        let connector = get_tls_connector()?;

        let addr = SocketAddr::new(resolved_ip, port);
        let stream = tokio::time::timeout(timeout, tokio::net::TcpStream::connect(addr))
            .await
            .map_err(|_| ProbeError::new(ReasonCode::TlsHandshakeFailed, "tcp connect timeout"))?
            .map_err(|e| ProbeError::new(ReasonCode::TlsHandshakeFailed, format!("tcp connect: {e}")))?;

        let server_name = ServerName::try_from(host.to_string())
            .map_err(|e| ProbeError::new(ReasonCode::TlsHandshakeFailed, format!("invalid sni: {e}")))?;

        let tls_stream: TlsStream<tokio::net::TcpStream> = tokio::time::timeout(
            timeout,
            connector.connect(server_name, stream),
        )
        .await
        .map_err(|_| ProbeError::new(ReasonCode::TlsHandshakeFailed, "tls connect timeout"))?
        .map_err(|e| {
            let reason = classify_tls_error(&e);
            ProbeError::new(reason, format!("tls connect: {e}"))
        })?;

        let (_, session) = tls_stream.get_ref();
        let peer_certs = session
            .peer_certificates()
            .ok_or_else(|| ProbeError::new(ReasonCode::TlsMissingCertificate, "no peer certificates from rustls"))?;

        let leaf = peer_certs
            .first()
            .ok_or_else(|| ProbeError::new(ReasonCode::TlsMissingCertificate, "empty cert chain from rustls"))?;

        extract_not_after_from_der(leaf.as_ref())
    }
}


fn extract_not_after_from_der(der: &[u8]) -> Result<DateTime<Utc>, ProbeError> {
    let (_rem, parsed) = x509_parser::certificate::X509Certificate::from_der(der)
        .map_err(|e| ProbeError::new(ReasonCode::TlsParseError, format!("parse cert failed: {e}")))?;

    let ts = parsed.tbs_certificate.validity.not_after.timestamp();
    let not_after = Utc
        .timestamp_opt(ts, 0)
        .single()
        .ok_or_else(|| ProbeError::new(ReasonCode::TlsParseError, "invalid not_after timestamp"))?;

    Ok(not_after)
}

fn get_tls_connector() -> Result<Arc<TlsConnector>, ProbeError> {
    static TLS_CONNECTOR: OnceLock<Result<Arc<TlsConnector>, ProbeError>> = OnceLock::new();

    match TLS_CONNECTOR.get_or_init(|| {
        ensure_crypto_provider();

        let mut roots = RootCertStore::empty();
        for cert in load_native_certs().map_err(|e| {
            ProbeError::new(ReasonCode::TlsParseError, format!("load roots: {e}"))
        })? {
            roots
                .add(cert)
                .map_err(|e| ProbeError::new(ReasonCode::TlsParseError, format!("add root: {e}")))?;
        }

        let config = ClientConfig::builder()
            .with_root_certificates(roots)
            .with_no_client_auth();

        Ok(Arc::new(TlsConnector::from(Arc::new(config))))
    }) {
        Ok(connector) => Ok(Arc::clone(connector)),
        Err(err) => Err(err.clone()),
    }
}

fn ensure_crypto_provider() {
    static INSTALLED: OnceLock<()> = OnceLock::new();
    let _ = INSTALLED.get_or_init(|| {
        if let Err(err) = tokio_rustls::rustls::crypto::ring::default_provider().install_default() {
            warn!(error = ?err, "failed to install ring crypto provider");
        }
    });
}

fn apply_custom_headers(
    mut builder: reqwest::RequestBuilder,
    headers: &[crate::monitor::RequestHeader],
) -> reqwest::RequestBuilder {
    for header in headers {
        if let Ok(name) = reqwest::header::HeaderName::from_bytes(header.key.as_bytes()) {
            if let Ok(value) = reqwest::header::HeaderValue::from_str(&header.value) {
                builder = builder.header(name, value);
            }
        }
    }
    builder
}

fn classify_reqwest_error(err: &reqwest::Error) -> ReasonCode {
    if err.is_timeout() {
        ReasonCode::HttpTimeout
    } else if err.is_connect() {
        ReasonCode::HttpConnectError
    } else if err.is_body() || err.is_decode() {
        ReasonCode::HttpBodyError
    } else if err.is_request() {
        ReasonCode::HttpRequestError
    } else {
        ReasonCode::HttpError
    }
}

fn map_reqwest_error(err: reqwest::Error) -> ProbeError {
    ProbeError::new(classify_reqwest_error(&err), err.to_string())
}

/// Classify TLS/rustls errors into specific reason codes.
/// Falls back to string matching if downcast fails.
/// See: https://docs.rs/rustls/latest/rustls/enum.CertificateError.html
fn classify_tls_error(err: &std::io::Error) -> ReasonCode {
    // Try to downcast to rustls::Error
    if let Some(rustls_err) = err.get_ref().and_then(|e| e.downcast_ref::<RustlsError>()) {
        if let RustlsError::InvalidCertificate(cert_err) = rustls_err {
            return match cert_err {
                CertificateError::NotValidForName => ReasonCode::TlsHostnameMismatch,
                CertificateError::Expired | CertificateError::ExpiredContext { .. } => ReasonCode::TlsExpired,
                CertificateError::NotValidYet | CertificateError::NotValidYetContext { .. } => ReasonCode::TlsNotYetValid,
                CertificateError::Revoked => ReasonCode::TlsRevoked,
                CertificateError::UnknownIssuer => ReasonCode::TlsUntrustedCa,
                CertificateError::BadEncoding | CertificateError::BadSignature => ReasonCode::TlsHandshakeFailed,
                _ => ReasonCode::TlsHandshakeFailed,
            };
        }
    }
    
    // Fallback to string matching for wrapped errors
    let msg = err.to_string().to_lowercase();
    if msg.contains("notvalidforname") {
        ReasonCode::TlsHostnameMismatch
    } else if msg.contains("expired") && !msg.contains("revocation") {
        ReasonCode::TlsExpired
    } else if msg.contains("notvalidyet") {
        ReasonCode::TlsNotYetValid
    } else if msg.contains("revoked") {
        ReasonCode::TlsRevoked
    } else if msg.contains("unknownissuer") {
        ReasonCode::TlsUntrustedCa
    } else {
        ReasonCode::TlsHandshakeFailed
    }
}
