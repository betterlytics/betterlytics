use anyhow::Result;
use aws_smithy_http_client::{tls, Builder as HttpClientBuilder};
use aws_sdk_s3::{Client, config::Region};
use aws_sdk_s3::config::http::HttpResponse;
use aws_sdk_s3::config::{BehaviorVersion, Credentials};
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
            // Without s3:ListBucket, AWS answers HeadObject on a missing key with 403 instead of 404.
            Err(e) if service_status(&e) == Some(403) => {
                warn!("S3 HeadObject on '{}' denied ({}); treating as absent, grant s3:ListBucket on the bucket to restore segment dedup", key, e);
                Ok(false)
            }
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
            if service_status(&e) == Some(403) {
                warn!("S3 HeadBucket on '{}' denied ({}); assuming bucket exists", bucket, e);
                Ok(())
            } else {
                Err(anyhow::anyhow!("S3 bucket '{}' not accessible: {}", bucket, e))
            }
        }
        Err(_) => Err(anyhow::anyhow!("S3 HeadBucket on '{}' timed out", bucket)),
    }
}

fn service_status<E>(e: &SdkError<E, HttpResponse>) -> Option<u16> {
    match e {
        SdkError::ServiceError(se) => Some(se.raw().status().as_u16()),
        _ => None,
    }
}

fn required(value: Option<String>, name: &str) -> Result<String> {
    match value {
        Some(v) if !v.trim().is_empty() => Ok(v),
        _ => Err(anyhow::anyhow!("{} must be set when S3_ENABLED=true", name)),
    }
}
