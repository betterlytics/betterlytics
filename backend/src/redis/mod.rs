use std::sync::Arc;

use redis::{aio::ConnectionManager, Client};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RedisInitError {
    #[error(transparent)] Redis(#[from] redis::RedisError),
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
        let manager = ConnectionManager::new(client.clone()).await?;
        Ok(Some(Arc::new(Self { client, manager })))
    }

    pub fn manager(&self) -> ConnectionManager {
        self.manager.clone()
    }

    pub async fn new_pubsub(&self) -> Result<redis::aio::PubSub, redis::RedisError> {
        self.client.get_async_pubsub().await
    }
}


