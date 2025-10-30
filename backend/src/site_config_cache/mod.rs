use std::sync::Arc;

use moka::sync::Cache;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::{error, info, warn, debug};

use crate::redis::{Redis, try_init as try_init_redis};
use std::time::Duration;
use tokio::time::timeout;
use tokio::sync::RwLock;

const CONFIG_KEY_PREFIX: &str = "site:cfg:";
const CONFIG_UPDATE_CHANNEL: &str = "site_cfg_updates";

#[derive(Debug, Error)]
pub enum SiteConfigError {
    #[error("Redis not configured")] 
    RedisNotConfigured,
    #[error(transparent)]
    Redis(#[from] redis::RedisError),
    #[error("Redis operation timed out")]
    Timeout,
    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiteConfig {
    pub site_id: String,
    pub blacklisted_ips: Vec<String>,
    pub enforce_domain: bool,
    pub domain: Option<String>,
    pub updated_at: String,
    pub version: u64,
}

#[derive(Clone)]
pub struct SiteConfigCache {
    cache: Cache<String, Arc<SiteConfig>>, // keyed by site_id
    redis: Arc<RwLock<Option<Arc<Redis>>>>,
}

impl SiteConfigCache {
    pub async fn new(redis: Option<Arc<Redis>>) -> Result<Self, SiteConfigError> {
        let cache = Cache::builder()
            .max_capacity(50_000)
            .time_to_live(std::time::Duration::from_secs(60 * 60))
            .build();

        Ok(Self { cache, redis: Arc::new(RwLock::new(redis)) })
    }

    pub async fn is_enabled(&self) -> bool { self.redis.read().await.is_some() }

    pub async fn set_redis(&self, redis: Option<Arc<Redis>>) {
        let mut lock = self.redis.write().await;
        *lock = redis;
    }

    pub async fn get_or_fetch(&self, site_id: &str) -> Result<Option<Arc<SiteConfig>>, SiteConfigError> {
        if let Some(cfg) = self.cache.get(site_id) {
            debug!(
                site_id = %site_id,
                domain = %cfg.domain.as_deref().unwrap_or(""),
                enforce_domain = %cfg.enforce_domain,
                blacklist_count = %cfg.blacklisted_ips.len(),
                version = %cfg.version,
                "site-config cache hit"
            );
            return Ok(Some(cfg));
        }

        debug!(site_id = %site_id, "site-config cache miss; fetching from Redis");
        let key = format!("{}{}", CONFIG_KEY_PREFIX, site_id);

        let redis = self.redis.read().await.clone();
        let Some(redis) = redis else {
            return Ok(None);
        };
        let mut manager = redis.manager();
        let payload: Option<String> = match timeout(Duration::from_millis(150), manager.get(&key)).await {
            Ok(res) => res?,
            Err(_) => {
                warn!(site_id = %site_id, "Redis GET timed out for site-config");
                return Err(SiteConfigError::Timeout);
            }
        };
        match payload {
            Some(json) => {
                let cfg: SiteConfig = serde_json::from_str(&json)?;
                let cfg = Arc::new(cfg);
                self.cache.insert(site_id.to_string(), cfg.clone());
                debug!(
                    site_id = %site_id,
                    domain = %cfg.domain.as_deref().unwrap_or(""),
                    enforce_domain = %cfg.enforce_domain,
                    blacklist_count = %cfg.blacklisted_ips.len(),
                    version = %cfg.version,
                    "site-config fetched from Redis and cached"
                );
                Ok(Some(cfg))
            }
            None => {
                debug!(site_id = %site_id, "no site-config found in Redis");
                Ok(None)
            },
        }
    }

    pub fn invalidate(&self, site_id: &str) {
        self.cache.invalidate(site_id);
    }

    pub async fn run_pubsub_listener(self: Arc<Self>) {
        let mut pubsub = match self.build_pubsub().await {
            Ok(ps) => ps,
            Err(e) => {
                warn!("Pubsub listener disabled because: {}", e);
                return;
            }
        };

        if let Err(e) = pubsub.subscribe(CONFIG_UPDATE_CHANNEL).await {
            error!("Failed to subscribe to '{}': {}", CONFIG_UPDATE_CHANNEL, e);
            return;
        }
        info!("Subscribed to '{}' for site config updates", CONFIG_UPDATE_CHANNEL);

        let mut stream = pubsub.on_message();
        while let Some(msg) = stream.next().await {
            match msg.get_payload::<String>() {
                Ok(payload) => {
                    let (site_id, msg_version) = match parse_update_payload(&payload) {
                        Some(v) => v,
                        None => {
                            warn!("Invalid config update payload: {}", payload);
                            continue;
                        }
                    };

                    if !self.should_refresh(&site_id, msg_version) {
                        debug!(site_id = %site_id, "skipping refresh; not a newer version");
                        continue;
                    }

                    debug!(site_id = %site_id, "received config update; invalidating cache");
                    self.invalidate(&site_id);
                    if let Err(e) = self.get_or_fetch(&site_id).await {
                        warn!("Failed to refresh site config for {}: {}", site_id, e);
                    } else {
                        debug!(site_id = %site_id, "site-config refreshed after update");
                    }
                }
                Err(e) => warn!("Failed to parse pubsub payload: {}", e),
            }
        }
    }

    fn should_refresh(&self, site_id: &str, msg_version: Option<u64>) -> bool {
        match msg_version {
            None => true,
            Some(v) => match self.cache.get(site_id) {
                Some(cfg) => cfg.version < v,
                None => true,
            },
        }
    }
    async fn build_pubsub(&self) -> Result<redis::aio::PubSub, SiteConfigError> {
        let redis = self.redis.read().await.clone();
        let Some(redis) = redis else { return Err(SiteConfigError::RedisNotConfigured) };
        let pubsub = redis.new_pubsub().await?;
        Ok(pubsub)
    }

    /// Spawn a supervisor that attaches Redis if needed and keeps the pubsub listener alive.
    /// If `redis_url` is None and Redis isn't already enabled, the supervisor won't run.
    pub async fn spawn_listener_with_reconnect(self: Arc<Self>, redis_url: Option<String>) {
        if redis_url.is_none() && !self.is_enabled().await {
            return;
        }

        let supervisor_cache = self.clone();
        tokio::spawn(async move {
            let mut delay = std::time::Duration::from_secs(2);
            loop {
                // Ensure Redis is attached if a URL is provided
                if supervisor_cache.is_enabled().await == false {
                    if let Some(url) = redis_url.clone() {
                        if let Some(client) = try_init_redis(Some(url)).await {
                            supervisor_cache.set_redis(Some(client)).await;
                            delay = std::time::Duration::from_secs(2);
                        } else {
                            tokio::time::sleep(delay).await;
                            delay = std::cmp::min(delay * 2, std::time::Duration::from_secs(60));
                            continue;
                        }
                    } else {
                        // No Redis configured and none attached; nothing to supervise
                        break;
                    }
                }

                // Run the listener until it exits (e.g., due to disconnect)
                supervisor_cache.clone().run_pubsub_listener().await;

                // Listener ended; back off then retry (will attach if needed next loop)
                tokio::time::sleep(delay).await;
                delay = std::cmp::min(delay * 2, std::time::Duration::from_secs(60));
            }
        });
    }
}

fn parse_update_payload(payload: &str) -> Option<(String, Option<u64>)> {
    #[derive(Deserialize)]
    struct P { site_id: String, version: Option<u64> }
    serde_json::from_str::<P>(payload).map(|p| (p.site_id, p.version)).ok()
}

// StreamExt for pubsub
use futures::StreamExt;