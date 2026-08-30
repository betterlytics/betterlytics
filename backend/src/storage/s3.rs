use anyhow::Result;
use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, config::Region};
use aws_sdk_s3::config::{Credentials, Builder as S3ConfigBuilder};
use aws_sdk_s3::error::SdkError;
use aws_sdk_s3::types::ServerSideEncryption;
use tracing::{info, warn};
use crate::config::Config;

const PUT_TIMEOUT_SECS: u64 = 10;
const HEAD_BUCKET_TIMEOUT_SECS: u64 = 10;

#[derive(Clone, Debug)]
pub struct S3Service {
    client: Client,
    pub bucket: String,
    sse_enabled: bool,
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

        head_bucket_check(&client, &bucket).await?;

        Ok(Some(Self { client, bucket, sse_enabled }))
    }

    pub async fn segment_exists(&self, key: &str) -> Result<bool> {
        let head = self.client.head_object().bucket(&self.bucket).key(key).send();
        match tokio::time::timeout(std::time::Duration::from_secs(PUT_TIMEOUT_SECS), head).await? {
            Ok(_) => Ok(true),
            Err(SdkError::ServiceError(e)) if e.err().is_not_found() => Ok(false),
            Err(e) => Err(e.into()),
        }
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
        tokio::time::timeout(std::time::Duration::from_secs(PUT_TIMEOUT_SECS), req.send())
            .await
            .map_err(|_| anyhow::anyhow!("S3 put_segment timed out"))??;
        Ok(())
    }
}


async fn head_bucket_check(client: &Client, bucket: &str) -> Result<()> {
    let head = client.head_bucket().bucket(bucket).send();
    match tokio::time::timeout(std::time::Duration::from_secs(HEAD_BUCKET_TIMEOUT_SECS), head).await {
        Ok(Ok(_)) => {
            info!("S3 bucket '{}' reachable", bucket);
            Ok(())
        }
        Ok(Err(e)) => {
            let status = match &e {
                SdkError::ServiceError(se) => Some(se.raw().status().as_u16()),
                _ => None,
            };
            if status == Some(403) {
                warn!("S3 HeadBucket on '{}' denied ({}); assuming bucket exists", bucket, e);
                Ok(())
            } else {
                Err(anyhow::anyhow!("S3 bucket '{}' not accessible: {}", bucket, e))
            }
        }
        Err(_) => Err(anyhow::anyhow!("S3 HeadBucket on '{}' timed out", bucket)),
    }
}
