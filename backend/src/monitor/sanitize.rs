use tracing::debug;

const BLOCKED_HEADERS: &[&str] = &[
  "host",
  "transfer-encoding",
  "content-length",
  "content-encoding",
  "accept-encoding",
  "connection",
  "upgrade",
  "keep-alive",
  "te",
  "trailer",
  "proxy-connection",
  "proxy-authenticate",
  "proxy-authorization",
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "via",
  ":authority",
  ":method",
  ":path",
  ":scheme",
  "expect",
  "range",
];

fn is_header_blocked(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    
    if BLOCKED_HEADERS.contains(&lower.as_str()) {
        return true;
    }
    
    if lower.starts_with("proxy-") {
        return true;
    }
    
    false
}

pub fn apply_custom_headers(
    mut builder: reqwest::RequestBuilder,
    headers: &[crate::monitor::RequestHeader],
) -> reqwest::RequestBuilder {
    for header in headers {
        if is_header_blocked(&header.key) {
            debug!(header = %header.key, "blocked dangerous header");
            continue;
        }
        
        if let Ok(name) = reqwest::header::HeaderName::from_bytes(header.key.as_bytes()) {
            if let Ok(value) = reqwest::header::HeaderValue::from_str(&header.value) {
                builder = builder.header(name, value);
            }
        }
    }
    builder
}
