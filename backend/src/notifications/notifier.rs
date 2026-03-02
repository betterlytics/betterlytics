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
