use std::sync::Arc;

use redis::{aio::ConnectionManager, Client};
use thiserror::Error;
use tokio::time::timeout;
use std::time::Duration;
use tracing::{warn, error};

#[derive(Debug, Error)]
pub enum RedisInitError {
    #[error(transparent)] Redis(#[from] redis::RedisError)
}

#[derive(Clone)]
pub struct Redis {
    client: Client,
    manager: ConnectionManager,
}

impl Redis {
    pub async fn new(url: Option<String>) -> Result<Option<Arc<Self>>, RedisInitError> {
        let Some(url) = url else { return Ok(None) };
        let client = Client::open(url.as_str())?;
    
        let manager = match timeout(Duration::from_secs(5), ConnectionManager::new(client.clone())).await {
            Ok(Ok(mgr)) => mgr,
            Ok(Err(e)) => {
                warn!(error = ?e, "Failed to connect to Redis at startup, continuing without Redis");
                return Ok(None);
            }
            Err(_) => {
                warn!("Redis connection timed out at startup, continuing without Redis");
                return Ok(None);
            }
        };
    
        Ok(Some(Arc::new(Self { client, manager })))
    }

    pub fn manager(&self) -> ConnectionManager {
        self.manager.clone()
    }

    pub async fn new_pubsub(&self) -> Result<redis::aio::PubSub, redis::RedisError> {
        self.client.get_async_pubsub().await
    }
}

/// Returns None when Redis is not configured or unavailable.
pub async fn try_init(url: Option<String>) -> Option<Arc<Redis>> {
    match Redis::new(url).await {
        Ok(Some(client)) => Some(client),
        Ok(None) => {
            // Already logged inside Redis::new
            None
        }
        Err(e) => {
            warn!(error = ?e, "Redis initialization failed, continuing without Redis");
            None
        }
    }
}


