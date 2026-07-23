mod cache;
mod crypto;
mod engine;
mod history;
mod integrations;
mod notifier;
mod repository;

use std::collections::HashMap;
use std::sync::Arc;

use anyhow::Context;

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::postgres::PostgresPool;

use integrations::discord::DiscordNotifier;
use integrations::pushover::PushoverNotifier;
use integrations::slack::SlackNotifier;
use integrations::teams::TeamsNotifier;
use integrations::webhook::WebhookNotifier;
use notifier::Notifier;

pub use cache::{IntegrationCache, IntegrationCacheConfig};
pub use engine::{DeliveryStrategy, NotificationEngine, NotificationEvent};
pub use history::new_notification_history_writer;
pub use notifier::{Notification, NotificationColor};
pub use repository::{IntegrationDataSource, IntegrationRepository};

pub async fn initialize_notification_engine(
    pool: Arc<PostgresPool>,
    clickhouse: Arc<ClickHouseClient>,
    config: &Config,
) -> anyhow::Result<Arc<NotificationEngine>> {
    let data_source: Arc<dyn IntegrationDataSource> =
        Arc::new(IntegrationRepository::new(pool, config.integration_encryption_key));

    let cache = IntegrationCache::initialize(data_source, IntegrationCacheConfig::default()).await?;
    let seeded_keys = history::load_recent_event_keys(&clickhouse).await?;
    let history_writer = new_notification_history_writer(
        clickhouse,
        history::NOTIFICATION_HISTORY_TABLE,
    )?;
    
    let notifiers = build_notifiers(config)?;

    Ok(Arc::new(NotificationEngine::new(
        cache,
        history_writer,
        notifiers,
        seeded_keys,
    )?))
}

fn build_notifiers(config: &Config) -> anyhow::Result<HashMap<String, Arc<dyn Notifier>>> {
    let mut notifiers: HashMap<String, Arc<dyn Notifier>> = HashMap::new();

    if let Some(token) = config.pushover_app_token.clone() {
        let pushover = Arc::new(
            PushoverNotifier::new(token)
                .context("failed to create Pushover HTTP client")?,
        );
        notifiers.insert(pushover.integration_type().to_string(), pushover);
    }

    let slack = Arc::new(
        SlackNotifier::new().context("failed to create Slack HTTP client")?,
    );
    notifiers.insert(slack.integration_type().to_string(), slack);

    let teams = Arc::new(
        TeamsNotifier::new().context("failed to create Teams HTTP client")?,
    );
    notifiers.insert(teams.integration_type().to_string(), teams);

    let discord = Arc::new(
        DiscordNotifier::new().context("failed to create Discord HTTP client")?,
    );
    notifiers.insert(discord.integration_type().to_string(), discord);

    let webhook = Arc::new(
        WebhookNotifier::new().context("failed to create Webhook HTTP client")?,
    );
    notifiers.insert(webhook.integration_type().to_string(), webhook);

    Ok(notifiers)
}
