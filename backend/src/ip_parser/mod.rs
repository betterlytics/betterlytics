use std::net::IpAddr;
use std::str::FromStr;

use axum::http::HeaderMap;

const HEADER_CANDIDATES: [&str; 5] = [
    "cf-connecting-ip",
    "true-client-ip",
    "x-real-ip",
    "x-forwarded-for",
    "forwarded",
];

pub fn parse_ip(headers: &HeaderMap) -> Result<IpAddr, ()> {
    for header in HEADER_CANDIDATES {
        if let Some(value) = headers.get(header) {
            if let Ok(value_str) = value.to_str() {
                if header == "forwarded" {
                    if let Some(ip) = parse_forwarded_header(value_str) {
                        return Ok(ip);
                    }
                    continue;
                }

                for part in value_str.split(',') {
                    let candidate = part.trim();
                    if let Ok(ip) = IpAddr::from_str(candidate) {
                        return Ok(ip);
                    }
                }
            }
        }
    }

    Err(())
}

fn parse_forwarded_header(value: &str) -> Option<IpAddr> {
    for proxy_entry in value.split(',') {
        for directive in proxy_entry.split(';') {
            let directive = directive.trim();
            if let Some(rest) = directive.strip_prefix("for=") {
                let cleaned = rest.trim_matches('"').trim_matches('[').trim_matches(']');
                if let Ok(ip) = IpAddr::from_str(cleaned) {
                    return Some(ip);
                }
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderMap;

    #[test]
    fn cloudflare_header() {
        let mut headers = HeaderMap::new();
        headers.insert("cf-connecting-ip", "1.2.3.4".parse().unwrap());
        assert_eq!(parse_ip(&headers).unwrap(), IpAddr::from([1, 2, 3, 4]));
    }

    #[test]
    fn x_forwarded_for_first_ip() {
        let mut headers = HeaderMap::new();
        headers.insert("x-forwarded-for", "1.2.3.4, 5.6.7.8".parse().unwrap());
        assert_eq!(parse_ip(&headers).unwrap(), IpAddr::from([1, 2, 3, 4]));
    }

    #[test]
    fn forwarded_rfc7239() {
        let mut headers = HeaderMap::new();
        headers.insert("forwarded", "for=1.2.3.4;proto=https".parse().unwrap());
        assert_eq!(parse_ip(&headers).unwrap(), IpAddr::from([1, 2, 3, 4]));
    }

    #[test]
    fn forwarded_multi_hop() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "forwarded",
            "for=1.2.3.4, for=5.6.7.8".parse().unwrap(),
        );
        assert_eq!(parse_ip(&headers).unwrap(), IpAddr::from([1, 2, 3, 4]));
    }

    #[test]
    fn forwarded_quoted_ipv6() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "forwarded",
            "for=\"[2001:db8::1]\"".parse().unwrap(),
        );
        assert_eq!(
            parse_ip(&headers).unwrap(),
            IpAddr::from_str("2001:db8::1").unwrap()
        );
    }

    #[test]
    fn priority_order_cloudflare_wins() {
        let mut headers = HeaderMap::new();
        headers.insert("cf-connecting-ip", "1.1.1.1".parse().unwrap());
        headers.insert("x-forwarded-for", "2.2.2.2".parse().unwrap());
        assert_eq!(parse_ip(&headers).unwrap(), IpAddr::from([1, 1, 1, 1]));
    }

    #[test]
    fn no_headers_returns_err() {
        let headers = HeaderMap::new();
        assert!(parse_ip(&headers).is_err());
    }
}
