use std::io::Read;
use std::sync::Arc;

use bytes::Bytes;
use chrono::NaiveDate;
use flate2::read::GzDecoder;
use once_cell::sync::Lazy;
use tokio::sync::Semaphore;

use crate::db::{SessionReplaySegmentRow, SharedDatabase};
use crate::storage::s3::S3Service;

const MAX_DECOMPRESSED_BYTES: u64 = 4 * 1024 * 1024;
const PEEK_BYTES: u64 = 256;

// Caps CPU spent inflating payloads: a flood of tiny gzip bombs (each up to
// MAX_DECOMPRESSED_BYTES) queues here instead of fanning out across the blocking pool.
const MAX_CONCURRENT_DECODES: usize = 8;
static DECODE_PERMITS: Lazy<Semaphore> = Lazy::new(|| Semaphore::new(MAX_CONCURRENT_DECODES));

#[derive(Debug)]
pub enum StoreError {
    InvalidPayload(String),
    Storage(anyhow::Error),
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidPayload(msg) => write!(f, "invalid payload: {}", msg),
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

pub struct SegmentPayload {
    bytes: Bytes,
    gzip: bool,
    data: Option<String>,
}

impl SegmentPayload {
    pub fn stored_size(&self) -> u64 {
        match &self.data {
            Some(data) => data.len() as u64,
            None => self.bytes.len() as u64,
        }
    }
}

impl SegmentStore {
    pub async fn exists(&self, site_id: &str, session_id: u64, filename: &str) -> Result<bool, StoreError> {
        match self {
            Self::ClickHouse(db) => db
                .replay_segment_exists(site_id, session_id, filename)
                .await
                .map_err(StoreError::Storage),
            Self::S3(s3) => s3
                .segment_exists(&object_key(site_id, session_id, filename))
                .await
                .map_err(StoreError::Storage),
        }
    }

    pub async fn prepare(&self, bytes: Bytes, gzip: bool) -> Result<SegmentPayload, StoreError> {
        let _permit = DECODE_PERMITS
            .acquire()
            .await
            .map_err(|_| StoreError::Storage(anyhow::anyhow!("decode semaphore closed")))?;
        let full = matches!(self, Self::ClickHouse(_));
        let decode_bytes = bytes.clone();
        let data = tokio::task::spawn_blocking(move || {
            if full {
                decode_segment(&decode_bytes, gzip).map(Some)
            } else {
                check_segment_prefix(&decode_bytes, gzip).map(|_| None)
            }
        })
        .await
        .map_err(|e| StoreError::Storage(anyhow::anyhow!("decode task failed: {}", e)))??;
        Ok(SegmentPayload { bytes, gzip, data })
    }

    pub async fn store(
        &self,
        site_id: &str,
        session_id: u64,
        filename: &str,
        epoch_ms: i64,
        date: NaiveDate,
        payload: SegmentPayload,
    ) -> Result<(), StoreError> {
        match self {
            Self::ClickHouse(db) => {
                let data = payload.data.expect("payload prepared for clickhouse");
                db.insert_replay_segment(SessionReplaySegmentRow {
                    site_id: site_id.to_string(),
                    session_id,
                    filename: filename.to_string(),
                    epoch_ms,
                    date,
                    size_bytes: data.len() as u64,
                    data,
                })
                .await
                .map_err(StoreError::Storage)?;
                Ok(())
            }
            Self::S3(s3) => {
                s3.put_segment(
                    &object_key(site_id, session_id, filename),
                    payload.bytes,
                    payload.gzip.then_some("gzip"),
                )
                .await
                .map_err(StoreError::Storage)?;
                Ok(())
            }
        }
    }
}

fn decode_segment(bytes: &[u8], gzip: bool) -> Result<String, StoreError> {
    let data = if gzip {
        gunzip_capped(bytes, MAX_DECOMPRESSED_BYTES).map_err(|e| match e {
            GunzipError::Invalid(msg) => StoreError::InvalidPayload(msg.to_string()),
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
    Ok(data)
}

fn check_segment_prefix(bytes: &[u8], gzip: bool) -> Result<(), StoreError> {
    let prefix = if gzip {
        read_gzip(bytes, PEEK_BYTES).map_err(|_| StoreError::InvalidPayload("invalid gzip".to_string()))?
    } else {
        bytes[..bytes.len().min(PEEK_BYTES as usize)].to_vec()
    };
    if !String::from_utf8_lossy(&prefix).trim_start().starts_with('[') {
        return Err(StoreError::InvalidPayload("not an rrweb events array".to_string()));
    }
    Ok(())
}

fn object_key(site_id: &str, session_id: u64, filename: &str) -> String {
    format!("site/{}/sess/{}/{}", site_id, session_id, filename)
}

#[derive(Debug)]
enum GunzipError {
    Invalid(&'static str),
    TooLarge,
}

fn read_gzip(bytes: &[u8], limit: u64) -> std::io::Result<Vec<u8>> {
    let mut out = Vec::new();
    GzDecoder::new(bytes).take(limit).read_to_end(&mut out)?;
    Ok(out)
}

fn gunzip_capped(bytes: &[u8], cap: u64) -> Result<String, GunzipError> {
    let out = read_gzip(bytes, cap + 1).map_err(|_| GunzipError::Invalid("invalid gzip"))?;
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
    fn stored_size_reflects_backing_store() {
        let wire = Bytes::from_static(b"compressed");
        let ch = SegmentPayload { bytes: wire.clone(), gzip: true, data: Some("x".repeat(100)) };
        assert_eq!(ch.stored_size(), 100);
        let s3 = SegmentPayload { bytes: wire.clone(), gzip: true, data: None };
        assert_eq!(s3.stored_size(), wire.len() as u64);
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

    #[test]
    fn decode_segment_rejects_non_array() {
        let compressed = gzip(br#"{"type":4}"#);
        assert!(matches!(
            decode_segment(&compressed, true),
            Err(StoreError::InvalidPayload(_))
        ));
    }

    #[test]
    fn prefix_check_accepts_oversized_array_gzip() {
        let big = vec![b'['; (MAX_DECOMPRESSED_BYTES + 1) as usize];
        let compressed = gzip(&big);
        assert!(check_segment_prefix(&compressed, true).is_ok());
    }

    #[test]
    fn prefix_check_rejects_non_array_gzip() {
        let compressed = gzip(br#"{"type":4}"#);
        assert!(matches!(
            check_segment_prefix(&compressed, true),
            Err(StoreError::InvalidPayload(_))
        ));
    }

    #[test]
    fn prefix_check_rejects_non_array_raw() {
        assert!(matches!(
            check_segment_prefix(br#"  {"type":4}"#, false),
            Err(StoreError::InvalidPayload(_))
        ));
        assert!(check_segment_prefix(b"  [1]", false).is_ok());
    }

    #[test]
    fn decode_segment_rejects_oversized_gzip() {
        let big = vec![b'['; (MAX_DECOMPRESSED_BYTES + 1) as usize];
        let compressed = gzip(&big);
        assert!(matches!(
            decode_segment(&compressed, true),
            Err(StoreError::InvalidPayload(msg)) if msg == "decompressed payload too large"
        ));
    }
}
