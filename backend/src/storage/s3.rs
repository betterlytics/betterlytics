use std::time::Duration;
use anyhow::Result;
use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, config::Region};
use aws_sdk_s3::config::{Credentials, Builder as S3ConfigBuilder};
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::types::ServerSideEncryption;
use crate::config::Config;

#[derive(Clone, Debug)]
pub struct S3Service {
    pub client: Client,
    pub bucket: String,
    pub sse_enabled: bool,
}

impl S3Service {
    pub async fn from_config(cfg: std::sync::Arc<Config>) -> Result<Option<Self>> {
        if !cfg.s3_enabled {
            return Ok(None);
        }

        let region = cfg.s3_region.clone().unwrap_or_else(|| "us-east-1".to_string());
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

        let s3_config = s3_builder.build();
        let client = Client::from_conf(s3_config);
        let sse_enabled = cfg.s3_sse_enabled;

        Ok(Some(Self { client, bucket, sse_enabled }))
    }

    pub fn build_replay_object_key(&self, site_id: &str, session_id: &str, epoch_ms_override: Option<i64>) -> String {
        let epoch_ms = epoch_ms_override.unwrap_or_else(|| chrono::Utc::now().timestamp_millis());
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


