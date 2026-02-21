mod cache;
mod crypto;
mod engine;
mod history;
mod integrations;
mod notifier;
mod repository;

use std::sync::Arc;
use tracing::warn;

use crate::clickhouse::ClickHouseClient;
use crate::config::Config;
use crate::postgres::PostgresPool;

pub use cache::{IntegrationCache, IntegrationCacheConfig};
pub use engine::NotificationEngine;
pub use history::new_notification_history_writer;
pub use notifier::Notification;
pub use repository::{IntegrationDataSource, IntegrationRepository};

pub async fn initialize_notification_engine(
    pool: Arc<PostgresPool>,
    clickhouse: Arc<ClickHouseClient>,
    config: &Config,
) -> Result<Arc<NotificationEngine>, Box<dyn std::error::Error + Send + Sync>> {
    let data_source: Arc<dyn IntegrationDataSource> =
        Arc::new(IntegrationRepository::new(pool, config.nextauth_secret.clone()));

    let cache = IntegrationCache::initialize(data_source, IntegrationCacheConfig::default()).await?;

    let history_writer = match new_notification_history_writer(
        clickhouse,
        "analytics.notification_history",
    ) {
        Ok(w) => Some(w),
        Err(err) => {
            warn!(error = ?err, "Failed to create notification history writer; notifications will not be recorded");
            None
        }
    };

    Ok(Arc::new(NotificationEngine::new(
        cache,
        history_writer,
        config.pushover_app_token.clone(),
    )))
}
