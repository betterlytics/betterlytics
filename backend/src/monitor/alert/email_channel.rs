use async_trait::async_trait;

use super::channel::{AlertChannel, AlertMessage, ChannelType};
use super::email as email_templates;
use crate::email::EmailService;

pub struct EmailAlertChannel {
    service: EmailService,
}

impl EmailAlertChannel {
    pub fn new(service: EmailService) -> Self {
        Self { service }
    }
}

#[async_trait]
impl AlertChannel for EmailAlertChannel {
    fn channel_type(&self) -> ChannelType {
        ChannelType::Email
    }

    async fn send(
        &self,
        message: &AlertMessage,
        recipients: &[String],
    ) -> Result<(), anyhow::Error> {
        let request = email_templates::build_email_from_message(message, recipients);
        self.service.send(request).await.map_err(Into::into)
    }
}
