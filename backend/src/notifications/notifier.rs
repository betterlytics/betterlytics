use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct Notification {
    pub title: String,
    pub message: String,
    pub priority: NotificationPriority,
    pub url: Option<String>,
    pub url_title: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum NotificationPriority {
    Low,
    Normal,
    High,
}

#[derive(Debug, thiserror::Error)]
pub enum NotifierError {
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("Provider rejected notification: {0}")]
    ProviderError(String),
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
}
