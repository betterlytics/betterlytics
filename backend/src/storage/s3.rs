use anyhow::Result;
use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, config::Region};
use aws_sdk_s3::config::{Credentials, Builder as S3ConfigBuilder};
use aws_sdk_s3::types::{
    AbortIncompleteMultipartUpload, BucketLifecycleConfiguration, ExpirationStatus,
    LifecycleExpiration, LifecycleRule, LifecycleRuleFilter, ServerSideEncryption,
};
use std::sync::Arc;
use tracing::{info, warn};
use crate::config::Config;

#[derive(Clone, Debug)]
pub struct S3Service {
    client: Client,
    pub bucket: String,
    sse_enabled: bool,
}

pub async fn configure_managed_bucket(
    config: &Config,
    s3_service: &Option<Arc<S3Service>>,
) {
    if !config.s3_manage_bucket_rules {
        return;
    }
    let Some(s3) = s3_service else {
        return;
    };
    let retention = config.replay_retention_days;
    for attempt in 1..=30u32 {
        match s3.ensure_replay_bucket_rules(retention).await {
            Ok(()) => {
                info!("replay bucket lifecycle rules ensured");
                return;
            }
            Err(e) if attempt == 30 => {
                panic!(
                    "Failed to apply replay bucket lifecycle rules after {} attempts: {}",
                    attempt, e
                );
            }
            Err(e) => {
                if attempt == 1 {
                    warn!("replay bucket rules not applied yet, retrying: {}", e);
                }
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            }
        }
    }
}

impl S3Service {
    pub async fn from_config(cfg: std::sync::Arc<Config>) -> Result<Option<Self>> {
        if !cfg.s3_enabled {
            return Ok(None);
        }

        let region = cfg.s3_region.clone().unwrap_or_else(|| "eu-central-1".to_string());
        let bucket = cfg.s3_bucket.clone().ok_or_else(|| anyhow::anyhow!("S3_BUCKET not set"))?;

        // Base loader
        let loader = aws_config::defaults(BehaviorVersion::latest()).region(Region::new(region.clone()));

        // Credentials override if provided (useful for local S3 like MinIO)
        let mut creds_opt = None;
        if let (Some(ak), Some(sk)) = (cfg.s3_access_key_id.clone(), cfg.s3_secret_access_key.clone()) {
            creds_opt = Some(Credentials::new(ak, sk, None, None, "static"));
        }

        let base_config = loader.load().await;
        let mut s3_builder = S3ConfigBuilder::from(&base_config)
            .region(Region::new(region));

        if let Some(creds) = creds_opt { s3_builder = s3_builder.credentials_provider(creds); }

        if let Some(endpoint) = cfg.s3_endpoint.clone() {
            s3_builder = s3_builder.endpoint_url(endpoint);
        }

        if cfg.s3_force_path_style {
            s3_builder = s3_builder.force_path_style(true);
        }

        let client = Client::from_conf(s3_builder.build());
        let sse_enabled = cfg.s3_sse_enabled;

        Ok(Some(Self { client, bucket, sse_enabled }))
    }

    pub async fn ensure_replay_bucket_rules(&self, retention_days: i32) -> Result<()> {
        let abort_rule = LifecycleRule::builder()
            .id("abort-incomplete-uploads")
            .status(ExpirationStatus::Enabled)
            .filter(LifecycleRuleFilter::builder().prefix("").build())
            .abort_incomplete_multipart_upload(
                AbortIncompleteMultipartUpload::builder().days_after_initiation(1).build(),
            )
            .build()?;

        let mut lifecycle = BucketLifecycleConfiguration::builder().rules(abort_rule);
        if retention_days > 0 {
            lifecycle = lifecycle.rules(
                LifecycleRule::builder()
                    .id("expire-replay-segments")
                    .status(ExpirationStatus::Enabled)
                    .filter(LifecycleRuleFilter::builder().prefix("").build())
                    .expiration(LifecycleExpiration::builder().days(retention_days).build())
                    .build()?,
            );
        }

        self.client
            .put_bucket_lifecycle_configuration()
            .bucket(&self.bucket)
            .lifecycle_configuration(lifecycle.build()?)
            .send()
            .await?;

        Ok(())
    }

    pub async fn put_segment(
        &self,
        key: &str,
        bytes: bytes::Bytes,
        content_encoding: Option<&str>,
    ) -> Result<()> {
        let mut req = self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type("application/json")
            .body(bytes.into());
        if let Some(enc) = content_encoding {
            req = req.content_encoding(enc);
        }
        if self.sse_enabled {
            req = req.server_side_encryption(ServerSideEncryption::Aes256);
        }
        req.send().await?;
        Ok(())
    }
}
