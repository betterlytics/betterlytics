use std::net::{IpAddr, SocketAddr};
use std::time::Duration;

use chrono::{DateTime, TimeZone, Utc};
use futures::StreamExt;
use reqwest::{Client, StatusCode, redirect::Policy, tls::Version};
use rustls_native_certs::load_native_certs;
use std::sync::{Arc, OnceLock};
use tokio::time::Instant;
use tokio_rustls::client::TlsStream;
use tokio_rustls::TlsConnector;
use tokio_rustls::rustls::{ClientConfig, RootCertStore};
use tokio_rustls::rustls::pki_types::ServerName;
use tracing::warn;
use url::Url;
use x509_parser::prelude::FromDer;

use crate::monitor::guard::{GuardError, MAX_REDIRECTS, MAX_RESPONSE_BYTES, validate_target};
use crate::monitor::models::MonitorStatus;
use crate::monitor::{MonitorCheck, ProbeOutcome, ReasonCode};

#[derive(Debug)]
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
        let response = self.follow_with_guards(&check.url, check.timeout).await;

        let latency = start.elapsed();

        match response {
            Ok((resp, resolved_ip, final_url, redirect_hops)) => self.http_outcome(
                latency,
                resp,
                resolved_ip,
                final_url,
                redirect_hops,
            ),
            Err(error) => self.http_failure(latency, check, error),
        }
    }

    pub async fn run_tls(&self, check: &MonitorCheck) -> ProbeOutcome {
        let start = Instant::now();

        if check.url.scheme() != "https" {
            return self
                .tls_error_outcome(start.elapsed(), ReasonCode::SchemeBlocked, "TLS checks require https scheme");
        }

        let guard = match validate_target(&check.url).await {
            Ok(guard) => guard,
            Err(err) => {
                return self.tls_error_outcome(start.elapsed(), err.reason_code, err.message);
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
                } else if days_left <= TLS_WARN_DAYS {
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
        resolved_ip: std::net::Ipv6Addr,
        final_url: String,
        redirect_hops: usize,
    ) -> ProbeOutcome {
        let status = resp.status;
        if status.is_success() {
            let mut outcome = ProbeOutcome::success(latency, Some(status.as_u16()), resolved_ip);
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
        ProbeOutcome::failure(latency, Some(status.as_u16()), reason_code, None)
    }

    fn http_failure(
        &self,
        latency: Duration,
        check: &MonitorCheck,
        error: ProbeError,
    ) -> ProbeOutcome {
        warn!(
            check = %check.id,
            reason = %error.reason_code.as_str(),
            error = %error.message,
            "probe request failed"
        );
        ProbeOutcome::failure(
            latency,
            None,
            error.reason_code,
            Some(error.message),
        )
    }

    fn tls_error_outcome(
        &self,
        latency: Duration,
        reason_code: ReasonCode,
        message: impl Into<String>,
    ) -> ProbeOutcome {
        let mut outcome =
            ProbeOutcome::failure(latency, None, reason_code, Some(message.into()));
        outcome.status = MonitorStatus::Error;
        outcome
    }

    fn tls_failure(
        &self,
        latency: Duration,
        check: &MonitorCheck,
        err: ProbeError,
    ) -> ProbeOutcome {
        warn!(
            check = %check.id,
            reason = %err.reason_code.as_str(),
            error = %err.message,
            "tls probe handshake failed"
        );
        self.tls_error_outcome(latency, err.reason_code, err.message)
    }

    async fn follow_with_guards(
        &self,
        url: &Url,
        timeout: Duration,
    ) -> Result<(CappedResponse, std::net::Ipv6Addr, String, usize), ProbeError> {
        let mut current_url = url.clone();
        let mut resolved_ip = validate_target(&current_url).await.map_err(ProbeError::from)?.resolved_ip;
        let mut hops = 0usize;

        for hop in 0..=MAX_REDIRECTS {
            let response = self.request_head_or_get(&current_url, timeout).await?;
            let status = response.status;

            if !status.is_redirection() {
                return Ok((response, resolved_ip, current_url.to_string(), hops));
            }

            let location = response
                .headers
                .get(reqwest::header::LOCATION)
                .and_then(|v| v.to_str().ok());

            let Some(location) = location else {
                return Ok((response, resolved_ip, current_url.to_string(), hops));
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
            hops += 1;
        }

        Err(ProbeError::new(
            ReasonCode::TooManyRedirects,
            "exceeded redirect limit",
        ))
    }

    async fn request_head_or_get(
        &self,
        url: &Url,
        timeout: Duration,
    ) -> Result<CappedResponse, ProbeError> {
        let head = self
            .client
            .head(url.clone())
            .timeout(timeout)
            .send()
            .await
            .map_err(map_reqwest_error)?;

        self.guard_content_length(head.content_length())?;

        let status = head.status();
        let headers = head.headers().clone();
        let content_length = head.content_length();
        let body_truncated = matches!(content_length, Some(len) if len > MAX_RESPONSE_BYTES as u64);

        if !should_fallback_to_get(status) {
            return Ok(CappedResponse::new(
                status,
                headers,
                content_length,
                body_truncated,
            ));
        }

        self.request_get_capped(url, timeout).await
    }

    async fn request_get_capped(
        &self,
        url: &Url,
        timeout: Duration,
    ) -> Result<CappedResponse, ProbeError> {
        let resp = self
            .client
            .get(url.clone())
            .timeout(timeout)
            .send()
            .await
            .map_err(map_reqwest_error)?;

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

    fn guard_content_length(&self, content_length: Option<u64>) -> Result<(), ProbeError> {
        if let Some(len) = content_length {
            if len > MAX_RESPONSE_BYTES as u64 {
                return Err(ProbeError::new(
                    ReasonCode::ResponseTooLarge,
                    format!("content-length {} exceeds limit", len),
                ));
            }
        }
        Ok(())
    }

    async fn direct_rustls_not_after(
        &self,
        url: &Url,
        timeout: Duration,
        resolved_ip: std::net::Ipv6Addr,
    ) -> Result<DateTime<Utc>, ProbeError> {
        let host = url
            .host_str()
            .ok_or_else(|| ProbeError::new(ReasonCode::InvalidHost, "missing host for tls"))?;
        let port = url.port_or_known_default().unwrap_or(443);

        ensure_crypto_provider();

        let roots = load_root_store()?;

        let config = ClientConfig::builder()
            .with_root_certificates((*roots).clone())
            .with_no_client_auth();

        let connector = TlsConnector::from(Arc::new(config));

        let ip = if let Some(v4) = resolved_ip.to_ipv4() {
            IpAddr::V4(v4)
        } else {
            IpAddr::V6(resolved_ip)
        };
        let addr = SocketAddr::new(ip, port);
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
        .map_err(|e| ProbeError::new(ReasonCode::TlsHandshakeFailed, format!("tls connect: {e}")))?;

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

const TLS_WARN_DAYS: i32 = 14;

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

fn load_root_store() -> Result<Arc<RootCertStore>, ProbeError> {
    static ROOT_STORE: OnceLock<Result<Arc<RootCertStore>, ProbeError>> = OnceLock::new();

    match ROOT_STORE.get_or_init(|| {
        let mut roots = RootCertStore::empty();
        for cert in load_native_certs().map_err(|e| {
            ProbeError::new(ReasonCode::TlsParseError, format!("load roots: {e}"))
        })? {
            roots
                .add(cert)
                .map_err(|e| ProbeError::new(ReasonCode::TlsParseError, format!("add root: {e}")))?;
        }

        Ok(Arc::new(roots))
    }) {
        Ok(store) => Ok(Arc::clone(store)),
        Err(err) => Err(ProbeError::new(err.reason_code, err.message.clone())),
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

fn should_fallback_to_get(status: StatusCode) -> bool {
    matches!(
        status,
        StatusCode::METHOD_NOT_ALLOWED
            | StatusCode::NOT_IMPLEMENTED
            | StatusCode::FORBIDDEN
            | StatusCode::BAD_REQUEST
    )
}

fn map_reqwest_error(err: reqwest::Error) -> ProbeError {
    ProbeError::new(classify_reqwest_error(&err), err.to_string())
}
