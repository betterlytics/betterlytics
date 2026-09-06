use std::time::Duration;
use anyhow::Result;
use aws_smithy_http_client::{tls, Builder as HttpClientBuilder};
use aws_sdk_s3::{Client, config::Region};
use aws_sdk_s3::config::{BehaviorVersion, Credentials};
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

        let region = cfg.s3_region.clone().unwrap_or_else(|| "eu-central-1".to_string());
        let bucket = required(cfg.s3_bucket.clone(), "S3_BUCKET")?;
        let access_key = required(cfg.s3_access_key_id.clone(), "S3_ACCESS_KEY_ID")?;
        let secret_key = required(cfg.s3_secret_access_key.clone(), "S3_SECRET_ACCESS_KEY")?;

        // Ring-backed HTTPS client, so the SDK never pulls in aws-lc.
        let http_client = HttpClientBuilder::new()
            .tls_provider(tls::Provider::Rustls(tls::rustls_provider::CryptoMode::Ring))
            .build_https();

        let mut s3_builder = aws_sdk_s3::Config::builder()
            .behavior_version(BehaviorVersion::latest())
            .region(Region::new(region))
            .credentials_provider(Credentials::new(access_key, secret_key, None, None, "static"))
            .http_client(http_client);

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

fn required(value: Option<String>, name: &str) -> Result<String> {
    match value {
        Some(v) if !v.trim().is_empty() => Ok(v),
        _ => Err(anyhow::anyhow!("{} must be set when S3_ENABLED=true", name)),
    }
}
