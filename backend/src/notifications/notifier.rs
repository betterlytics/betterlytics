use async_trait::async_trait;

#[derive(Debug, Clone, Copy, Default)]
pub enum NotificationColor {
    #[default]
    Default,
    Success,
    Danger,
    Warning,
}

impl NotificationColor {
    pub fn to_hex(self) -> u32 {
        match self {
            NotificationColor::Default => 0x5C7DEB,
            NotificationColor::Success => 0x10B981,
            NotificationColor::Danger  => 0xEF4444,
            NotificationColor::Warning => 0xF59E0B,
        }
    }

    pub fn to_hex_string(self) -> &'static str {
        match self {
            NotificationColor::Default => "#5C7DEB",
            NotificationColor::Success => "#10B981",
            NotificationColor::Danger  => "#EF4444",
            NotificationColor::Warning => "#F59E0B",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Notification {
    pub title: String,
    pub message: String,
    pub url: Option<String>,
    pub url_title: Option<String>,
    pub color: NotificationColor,
}

#[derive(Debug, thiserror::Error)]
pub enum NotifierError {
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("Provider rejected notification: {0}")]
    ProviderError(String),
    #[error("Transient provider error: {0}")]
    TransientProviderError(String),
}

impl NotifierError {
    pub fn is_transient(&self) -> bool {
        match self {
            NotifierError::InvalidConfig(_) => false,
            NotifierError::HttpError(e) => {
                // A GuardedResolver denial or a redirect-policy refusal repeats on every attempt
                if is_guard_refusal(e) {
                    return false;
                }
                if e.is_timeout() || e.is_connect() {
                    return true;
                }
                if let Some(status) = e.status() {
                    return status.is_server_error();
                }
                true // network errors without status are transient
            }
            NotifierError::ProviderError(_) => false,
            NotifierError::TransientProviderError(_) => true,
        }
    }
}

fn is_guard_refusal(e: &reqwest::Error) -> bool {
    if e.is_redirect() {
        return true;
    }
    let mut source = std::error::Error::source(e);
    while let Some(err) = source {
        if let Some(io) = err.downcast_ref::<std::io::Error>()
            && io.kind() == std::io::ErrorKind::PermissionDenied
        {
            return true;
        }
        source = err.source();
    }
    false
}

const ERROR_BODY_READ_LIMIT: usize = 1024;
const ERROR_BODY_PREVIEW_CHARS: usize = 200;

/// Short preview of a failed provider response for history and logs; never buffers the whole body.
pub async fn error_body_preview(mut response: reqwest::Response) -> String {
    let mut buf = Vec::new();
    while buf.len() < ERROR_BODY_READ_LIMIT {
        match response.chunk().await {
            Ok(Some(chunk)) => buf.extend_from_slice(&chunk),
            Ok(None) => break,
            Err(_) if buf.is_empty() => return "failed to read response body".to_string(),
            Err(_) => break,
        }
    }
    preview(&buf)
}

// 1024 bytes always hold more than 200 chars, so a char split at the byte cap is never in the preview
fn preview(bytes: &[u8]) -> String {
    let text = String::from_utf8_lossy(&bytes[..bytes.len().min(ERROR_BODY_READ_LIMIT)]);
    let mut chars = text.chars();
    let mut out: String = chars.by_ref().take(ERROR_BODY_PREVIEW_CHARS).collect();
    if chars.next().is_some() {
        out.push_str("...");
    }
    out
}

#[async_trait]
pub trait Notifier: Send + Sync {
    fn integration_type(&self) -> &'static str;
    async fn send(
        &self,
        config: &serde_json::Value,
        notification: &Notification,
    ) -> Result<(), NotifierError>;

    fn audit_metadata(&self, _config: &serde_json::Value) -> serde_json::Value {
        serde_json::Value::Object(serde_json::Map::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    use crate::monitor::guard::{self, GuardedResolver};

    async fn serve_once(status_line: &'static str, extra_headers: &'static [&'static str], body: Vec<u8>) -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}/", listener.local_addr().unwrap());
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buf = [0u8; 4096];
            let _ = socket.read(&mut buf).await;
            let mut head = format!("HTTP/1.1 {status_line}\r\n");
            for header in extra_headers {
                head.push_str(header);
                head.push_str("\r\n");
            }
            head.push_str(&format!("Content-Length: {}\r\nConnection: close\r\n\r\n", body.len()));
            socket.write_all(head.as_bytes()).await.unwrap();
            socket.write_all(&body).await.unwrap();
            socket.shutdown().await.unwrap();
        });
        url
    }

    #[tokio::test]
    async fn resolver_denials_are_not_transient() {
        // Loopback is always refused, so localhost resolves to nothing dialable
        let client = reqwest::Client::builder()
            .dns_resolver(Arc::new(GuardedResolver))
            .build()
            .unwrap();
        let err = client.post("http://localhost:9/").send().await.unwrap_err();
        assert!(!NotifierError::HttpError(err).is_transient());
    }

    #[tokio::test]
    async fn redirect_refusals_are_not_transient() {
        // The IP-literal origin bypasses resolvers; the policy refuses http://169.254.169.254/
        let url = serve_once("302 Found", &["Location: http://169.254.169.254/"], vec![]).await;
        let client = reqwest::Client::builder()
            .redirect(guard::webhook_redirect_policy())
            .build()
            .unwrap();
        let err = client.post(url).send().await.unwrap_err();
        assert!(err.is_redirect());
        assert!(!NotifierError::HttpError(err).is_transient());
    }

    #[tokio::test]
    async fn error_body_preview_is_capped() {
        let url = serve_once("400 Bad Request", &[], vec![b'x'; 5000]).await;
        let response = reqwest::Client::new().post(url).send().await.unwrap();
        assert_eq!(error_body_preview(response).await, format!("{}...", "x".repeat(200)));

        let url = serve_once("400 Bad Request", &[], b"invalid_payload".to_vec()).await;
        let response = reqwest::Client::new().post(url).send().await.unwrap();
        assert_eq!(error_body_preview(response).await, "invalid_payload");
    }

    #[test]
    fn preview_keeps_multibyte_chars_whole() {
        let body = "æ".repeat(300);
        assert_eq!(preview(body.as_bytes()), format!("{}...", "æ".repeat(200)));
    }
}
