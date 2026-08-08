use axum::extract::{ConnectInfo, FromRequestParts};
use axum::http::HeaderMap;
use axum::http::request::Parts;
use std::convert::Infallible;
use std::net::SocketAddr;

/// Client identity of a tracking request, extracted once per handler: proxy-aware
/// IP, User-Agent header, and browser speculative-loading (prefetch) flag.
pub struct ClientRequest {
    pub ip: String,
    pub user_agent: String,
    pub prefetch: bool,
}

impl<S: Send + Sync> FromRequestParts<S> for ClientRequest {
    type Rejection = Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let ip = crate::ip_parser::parse_ip(&parts.headers)
            .ok()
            .or_else(|| {
                parts
                    .extensions
                    .get::<ConnectInfo<SocketAddr>>()
                    .map(|connect_info| connect_info.0.ip())
            })
            .map(|ip| ip.to_string())
            .unwrap_or_default();

        Ok(Self {
            ip,
            user_agent: user_agent(&parts.headers).to_string(),
            prefetch: is_prefetch(&parts.headers),
        })
    }
}

pub fn user_agent(headers: &HeaderMap) -> &str {
    headers
        .get(axum::http::header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
}

/// Detects browser speculative-loading headers; an activated prerender is a real
/// visit, which is why this is a shadow signal
pub fn is_prefetch(headers: &HeaderMap) -> bool {
    let header_value = |name: &str| {
        headers
            .get(name)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_ascii_lowercase()
    };

    if header_value("x-moz") == "prefetch" {
        return true;
    }

    for name in ["x-purpose", "purpose"] {
        let value = header_value(name);
        if value == "prefetch" || value == "preview" {
            return true;
        }
    }

    let sec_purpose = header_value("sec-purpose");
    sec_purpose.contains("prefetch") || sec_purpose.contains("prerender")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_prefetch_headers() {
        let cases = [
            ("x-moz", "prefetch"),
            ("x-purpose", "prefetch"),
            ("x-purpose", "preview"),
            ("purpose", "prefetch"),
            ("sec-purpose", "prefetch;prerender"),
            ("sec-purpose", "prefetch"),
        ];
        for (name, value) in cases {
            let mut headers = HeaderMap::new();
            headers.insert(name, value.parse().unwrap());
            assert!(is_prefetch(&headers), "should detect prefetch: {}: {}", name, value);
        }

        let mut normal = HeaderMap::new();
        normal.insert("user-agent", "Mozilla/5.0".parse().unwrap());
        normal.insert("sec-fetch-mode", "cors".parse().unwrap());
        assert!(!is_prefetch(&normal));
        assert!(!is_prefetch(&HeaderMap::new()));
    }
}
