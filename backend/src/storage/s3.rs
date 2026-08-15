use std::time::Duration;
use anyhow::Result;
use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, config::Region};
use aws_sdk_s3::config::{Credentials, Builder as S3ConfigBuilder};
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::types::{
    AbortIncompleteMultipartUpload, BucketLifecycleConfiguration, CorsConfiguration, CorsRule,
    ExpirationStatus, LifecycleExpiration, LifecycleRule, LifecycleRuleFilter, ServerSideEncryption,
};
use std::sync::Arc;
use tracing::{info, warn};
use crate::config::Config;

#[derive(Clone, Debug)]
pub struct S3Service {
    // Presigning client; signs against the public endpoint since SigV4 covers host + path
    pub client: Client,
    // Control-plane client; real HTTP calls must not hairpin through the public URL
    internal_client: Client,
    pub bucket: String,
    pub sse_enabled: bool,
}

pub fn spawn_replay_bucket_rules(config: &Config, s3_service: &Option<Arc<S3Service>>) {
    if !config.s3_manage_bucket_rules {
        return;
    }
    let Some(s3) = s3_service.clone() else {
        return;
    };
    let retention = config.replay_retention_days;
    tokio::spawn(async move {
        // The bundled Garage starts concurrently under supervisord; retry until it answers
        for attempt in 1..=30u32 {
            match s3.ensure_replay_bucket_rules(retention).await {
                Ok(()) => {
                    info!("replay bucket CORS and lifecycle rules ensured");
                    return;
                }
                Err(e) if attempt == 30 => {
                    warn!("giving up on replay bucket CORS/lifecycle rules: {}", e);
                }
                Err(_) => tokio::time::sleep(std::time::Duration::from_secs(2)).await,
            }
        }
    });
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

        let client = Client::from_conf(s3_builder.clone().build());
        let internal_client = match cfg.s3_internal_endpoint.clone() {
            Some(endpoint) => Client::from_conf(s3_builder.endpoint_url(endpoint).build()),
            None => client.clone(),
        };
        let sse_enabled = cfg.s3_sse_enabled;

        Ok(Some(Self { client, internal_client, bucket, sse_enabled }))
    }

    pub async fn ensure_replay_bucket_rules(&self, retention_days: i32) -> Result<()> {
        self.internal_client
            .put_bucket_cors()
            .bucket(&self.bucket)
            .cors_configuration(
                CorsConfiguration::builder()
                    .cors_rules(
                        CorsRule::builder()
                            .allowed_origins("*")
                            .allowed_methods("GET")
                            .allowed_methods("PUT")
                            .allowed_methods("HEAD")
                            // presigned PUTs send signed Content-Type/Content-Encoding headers
                            .allowed_headers("*")
                            .max_age_seconds(3600)
                            .build()?,
                    )
                    .build()?,
            )
            .send()
            .await?;

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

        self.internal_client
            .put_bucket_lifecycle_configuration()
            .bucket(&self.bucket)
            .lifecycle_configuration(lifecycle.build()?)
            .send()
            .await?;

        Ok(())
    }

    pub fn build_replay_object_key(&self, site_id: &str, session_id: u64, epoch_ms: i64) -> String {
        let suffix: String = nanoid::nanoid!(6);
        let filename = format!("{:013}-{}.json", epoch_ms, suffix);
        format!("site/{}/sess/{}/{}", site_id, session_id, filename)
    }

    pub async fn presign_replay_put(
        &self,
        key: &str,
        content_type: &str,
        content_encoding: Option<&str>,
        content_length: u64,
        ttl_secs: u64,
    ) -> Result<String> {
        let mut req = self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type);
        req = req.content_length(content_length as i64);
        if let Some(enc) = content_encoding {
            req = req.content_encoding(enc);
        }
        if self.sse_enabled {
            req = req.server_side_encryption(ServerSideEncryption::Aes256);
        }
        let cfg = PresigningConfig::expires_in(Duration::from_secs(ttl_secs))?;
        let presigned = req.presigned(cfg).await?;
        Ok(presigned.uri().to_string())
    }
}


