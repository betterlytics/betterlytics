use std::io::Read;
use std::sync::Arc;

use bytes::Bytes;
use flate2::read::GzDecoder;

use crate::db::{SessionReplaySegmentRow, SharedDatabase};
use crate::storage::s3::S3Service;

const MAX_DECOMPRESSED_BYTES: u64 = 32 * 1024 * 1024;

#[derive(Debug)]
pub enum StoreError {
    InvalidPayload(String),
    BudgetExceeded,
    Storage(anyhow::Error),
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidPayload(msg) => write!(f, "invalid payload: {}", msg),
            Self::BudgetExceeded => write!(f, "session replay size limit exceeded"),
            Self::Storage(e) => write!(f, "storage failure: {}", e),
        }
    }
}

// Enum + static dispatch, not a trait: two known variants, no async_trait/dyn
// machinery. Promote to a trait only if a third backend ever appears.
pub enum SegmentStore {
    ClickHouse(SharedDatabase),
    S3(Arc<S3Service>),
}

impl SegmentStore {
    pub async fn store(
        &self,
        site_id: &str,
        session_id: u64,
        filename: &str,
        bytes: Bytes,
        gzip: bool,
        budget: u64,
    ) -> Result<u64, StoreError> {
        match self {
            Self::ClickHouse(db) => {
                let data = if gzip {
                    gunzip_capped(&bytes, MAX_DECOMPRESSED_BYTES.min(budget)).map_err(|e| match e {
                        GunzipError::Invalid(msg) => StoreError::InvalidPayload(msg.to_string()),
                        GunzipError::TooLarge if budget < MAX_DECOMPRESSED_BYTES => StoreError::BudgetExceeded,
                        GunzipError::TooLarge => {
                            StoreError::InvalidPayload("decompressed payload too large".to_string())
                        }
                    })?
                } else {
                    String::from_utf8(bytes.to_vec())
                        .map_err(|_| StoreError::InvalidPayload("not valid UTF-8".to_string()))?
                };
                if !data.trim_start().starts_with('[') {
                    return Err(StoreError::InvalidPayload("not an rrweb events array".to_string()));
                }
                let epoch_ms = parse_epoch_ms(filename)?;
                let date = chrono::DateTime::from_timestamp_millis(epoch_ms)
                    .ok_or_else(|| StoreError::InvalidPayload("epoch out of range".to_string()))?
                    .date_naive();
                let size_bytes = data.len() as u64;
                db.insert_replay_segment(SessionReplaySegmentRow {
                    site_id: site_id.to_string(),
                    session_id,
                    filename: filename.to_string(),
                    epoch_ms,
                    date,
                    size_bytes,
                    data,
                })
                .await
                .map_err(StoreError::Storage)?;
                Ok(size_bytes)
            }
            Self::S3(s3) => {
                let size_bytes = bytes.len() as u64;
                s3.put_segment(
                    &object_key(site_id, session_id, filename),
                    bytes,
                    gzip.then_some("gzip"),
                )
                .await
                .map_err(StoreError::Storage)?;
                Ok(size_bytes)
            }
        }
    }
}

fn object_key(site_id: &str, session_id: u64, filename: &str) -> String {
    format!("site/{}/sess/{}/{}", site_id, session_id, filename)
}

fn parse_epoch_ms(filename: &str) -> Result<i64, StoreError> {
    filename
        .split('-')
        .next()
        .and_then(|prefix| prefix.parse().ok())
        .ok_or_else(|| StoreError::InvalidPayload("malformed filename".to_string()))
}

#[derive(Debug)]
enum GunzipError {
    Invalid(&'static str),
    TooLarge,
}

fn gunzip_capped(bytes: &[u8], cap: u64) -> Result<String, GunzipError> {
    let mut out = Vec::new();
    GzDecoder::new(bytes)
        .take(cap + 1)
        .read_to_end(&mut out)
        .map_err(|_| GunzipError::Invalid("invalid gzip"))?;
    if out.len() as u64 > cap {
        return Err(GunzipError::TooLarge);
    }
    String::from_utf8(out).map_err(|_| GunzipError::Invalid("not valid UTF-8"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn gzip(data: &[u8]) -> Vec<u8> {
        let mut encoder = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
        encoder.write_all(data).unwrap();
        encoder.finish().unwrap()
    }

    #[test]
    fn valid_gzip_roundtrips() {
        let original = r#"[{"type":4,"data":{},"timestamp":1755000000000}]"#;
        let compressed = gzip(original.as_bytes());
        assert_eq!(gunzip_capped(&compressed, MAX_DECOMPRESSED_BYTES).unwrap(), original);
    }

    #[test]
    fn payload_exceeding_cap_errors() {
        let big = vec![b'a'; 1024];
        let compressed = gzip(&big);
        assert!(matches!(
            gunzip_capped(&compressed, 512),
            Err(GunzipError::TooLarge)
        ));
    }

    #[test]
    fn non_gzip_bytes_error() {
        assert!(matches!(
            gunzip_capped(b"definitely not gzip", MAX_DECOMPRESSED_BYTES),
            Err(GunzipError::Invalid(_))
        ));
    }
}
