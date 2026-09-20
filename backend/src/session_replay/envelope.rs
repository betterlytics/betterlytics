use std::collections::{BTreeSet, HashMap};

use bytes::Bytes;

use super::store::StoreError;
use crate::error_fingerprint::generate_error_fingerprint;
use crate::validation::ValidationConfig;

pub(super) const MAX_METADATA_BYTES: usize = 256 * 1024;
const MAX_ERROR_SOURCES: usize = 128;
const FORMAT_ERRORS_V1: &str = "errors_v1";

#[derive(Default, Debug, PartialEq)]
pub(super) struct ChunkErrors {
    pub fingerprints: Vec<String>,
    pub count: u32,
}

pub(super) fn split_body(body: Bytes, format: Option<&str>) -> Result<(Bytes, Bytes), StoreError> {
    let Some(format) = format else {
        return Ok((body, Bytes::new()));
    };
    if format != FORMAT_ERRORS_V1 || body.len() < 4 {
        return Err(StoreError::InvalidPayload("invalid replay envelope".to_string()));
    }
    let size = u32::from_be_bytes([body[0], body[1], body[2], body[3]]) as usize;
    if size == 0 || size > MAX_METADATA_BYTES || size >= body.len() - 4 {
        return Err(StoreError::InvalidPayload("invalid metadata length".to_string()));
    }
    Ok((body.slice(4 + size..), body.slice(4..4 + size)))
}

pub(super) fn fingerprint_metadata(metadata: &[u8], event_count: Option<u32>) -> ChunkErrors {
    if metadata.is_empty() {
        return ChunkErrors::default();
    }
    let Ok(entries) = serde_json::from_slice::<Vec<serde_json::Value>>(metadata) else {
        return ChunkErrors::default();
    };
    let max_source = ValidationConfig::default().max_error_exceptions_size;
    let mut fingerprints = BTreeSet::new();
    let mut by_source = HashMap::<&str, Option<String>>::new();
    let mut count = 0u64;
    for entry in entries.iter().take(MAX_ERROR_SOURCES) {
        let (Some(raw), Some(n)) = (entry["error_exceptions"].as_str(), entry["count"].as_u64()) else {
            continue;
        };
        if raw.len() > max_source || n == 0 || n > u64::from(u32::MAX) {
            continue;
        }
        let Some(fingerprint) = by_source.entry(raw).or_insert_with(|| fingerprint_source(raw)) else {
            continue;
        };
        fingerprints.insert(fingerprint.clone());
        count += n;
    }
    if count > u64::from(event_count.unwrap_or(0)) {
        return ChunkErrors::default();
    }
    ChunkErrors {
        fingerprints: fingerprints.into_iter().collect(),
        count: count as u32,
    }
}

fn fingerprint_source(raw: &str) -> Option<String> {
    let exceptions = serde_json::from_str::<serde_json::Value>(raw).ok()?;
    let first = exceptions.as_array()?.first()?;
    if !first.is_object() {
        return None;
    }
    let error_type = first["type"].as_str().unwrap_or("");
    let fingerprint = generate_error_fingerprint(error_type, raw);
    (!fingerprint.is_empty()).then_some(fingerprint)
}

#[cfg(test)]
mod tests {
    use super::*;

    const V8: &str = r#"[{"type":"TypeError","value":"Cannot read properties of undefined (reading 'x')","mechanism":"onerror","stack":"TypeError: Cannot read properties of undefined (reading 'x')\n    at render (https://app.example.com/static/app.js:12:345)\n    at commit (https://app.example.com/static/app.js:13:10)"}]"#;
    const FIREFOX: &str = r#"[{"type":"TypeError","value":"a is undefined","mechanism":"onerror","stack":"render@https://app.example.com/static/app.js:12:345\ncommit@https://app.example.com/static/app.js:13:10"}]"#;
    const NO_STACK: &str = r#"[{"type":"RangeError","value":"boom","mechanism":"onunhandledrejection","stack":""}]"#;

    fn envelope(metadata: &[u8], replay: &[u8]) -> Bytes {
        let mut body = Vec::with_capacity(4 + metadata.len() + replay.len());
        body.extend_from_slice(&(metadata.len() as u32).to_be_bytes());
        body.extend_from_slice(metadata);
        body.extend_from_slice(replay);
        Bytes::from(body)
    }

    fn metadata(entries: &[(&str, u64)]) -> Vec<u8> {
        let entries: Vec<serde_json::Value> = entries
            .iter()
            .map(|(raw, count)| serde_json::json!({ "error_exceptions": raw, "count": count }))
            .collect();
        serde_json::to_vec(&entries).unwrap()
    }

    fn expected(raw: &str) -> String {
        let error_type = serde_json::from_str::<serde_json::Value>(raw).unwrap()[0]["type"]
            .as_str()
            .unwrap()
            .to_string();
        generate_error_fingerprint(&error_type, raw)
    }

    #[test]
    fn missing_format_passes_the_body_through_untouched() {
        let body = Bytes::from_static(b"[{\"type\":4}]");
        let (replay, meta) = split_body(body.clone(), None).unwrap();
        assert_eq!(replay, body);
        assert!(meta.is_empty());
    }

    #[test]
    fn splits_raw_and_gzip_replay_bytes_exactly() {
        let meta = "[{\"error_exceptions\":\"\\u00e9\",\"count\":1}]".as_bytes();
        for replay in [&b"[{\"type\":4}]"[..], &[0x1f, 0x8b, 0x08, 0x00, 0xff, 0x00][..]] {
            let (got_replay, got_meta) = split_body(envelope(meta, replay), Some("errors_v1")).unwrap();
            assert_eq!(&got_replay[..], replay);
            assert_eq!(&got_meta[..], meta);
        }
    }

    #[test]
    fn rejects_unknown_truncated_and_mis_sized_frames() {
        let good = envelope(b"[]", b"[]");
        assert!(matches!(split_body(good.clone(), Some("errors_v2")), Err(StoreError::InvalidPayload(_))));
        assert!(matches!(split_body(Bytes::from_static(b"\0\0\0"), Some("errors_v1")), Err(StoreError::InvalidPayload(_))));
        assert!(matches!(split_body(envelope(b"", b"[]"), Some("errors_v1")), Err(StoreError::InvalidPayload(_))));
        assert!(matches!(split_body(envelope(b"[]", b""), Some("errors_v1")), Err(StoreError::InvalidPayload(_))));
        let mut oversized = Vec::new();
        oversized.extend_from_slice(&((MAX_METADATA_BYTES + 1) as u32).to_be_bytes());
        oversized.resize(4 + MAX_METADATA_BYTES + 10, b' ');
        assert!(matches!(split_body(Bytes::from(oversized), Some("errors_v1")), Err(StoreError::InvalidPayload(_))));
        let mut lying = Vec::new();
        lying.extend_from_slice(&100u32.to_be_bytes());
        lying.extend_from_slice(b"[]short");
        assert!(matches!(split_body(Bytes::from(lying), Some("errors_v1")), Err(StoreError::InvalidPayload(_))));
    }

    #[test]
    fn fingerprints_match_the_event_pipeline_for_every_stack_shape() {
        for raw in [V8, FIREFOX, NO_STACK] {
            let got = fingerprint_metadata(&metadata(&[(raw, 1)]), Some(10));
            assert_eq!(got, ChunkErrors { fingerprints: vec![expected(raw)], count: 1 });
        }
    }

    #[test]
    fn distinct_sources_are_unioned_and_duplicates_sum_their_counts() {
        let got = fingerprint_metadata(&metadata(&[(V8, 2), (NO_STACK, 1), (V8, 3)]), Some(10));
        let mut fingerprints = vec![expected(V8), expected(NO_STACK)];
        fingerprints.sort();
        assert_eq!(got, ChunkErrors { fingerprints, count: 6 });
    }

    #[test]
    fn invalid_oversized_and_zero_count_sources_are_skipped() {
        let oversized = format!(r#"[{{"type":"TypeError","value":"{}","stack":""}}]"#, "x".repeat(17 * 1024));
        let got = fingerprint_metadata(
            &metadata(&[("not json", 1), ("[1]", 1), ("[]", 1), (&oversized, 1), (V8, 0), (NO_STACK, 2)]),
            Some(10),
        );
        assert_eq!(got, ChunkErrors { fingerprints: vec![expected(NO_STACK)], count: 2 });
    }

    #[test]
    fn counts_beyond_the_chunk_event_count_drop_the_association() {
        assert_eq!(fingerprint_metadata(&metadata(&[(V8, 3)]), Some(2)), ChunkErrors::default());
        assert_eq!(fingerprint_metadata(&metadata(&[(V8, 1)]), None), ChunkErrors::default());
    }

    #[test]
    fn malformed_or_empty_metadata_yields_no_association() {
        assert_eq!(fingerprint_metadata(b"", Some(5)), ChunkErrors::default());
        assert_eq!(fingerprint_metadata(b"{", Some(5)), ChunkErrors::default());
        assert_eq!(fingerprint_metadata(b"{\"a\":1}", Some(5)), ChunkErrors::default());
        assert_eq!(fingerprint_metadata(b"[1,\"x\",null]", Some(5)), ChunkErrors::default());
    }

    #[test]
    #[ignore]
    fn metadata_timing_probe() {
        use std::hint::black_box;
        use std::time::Instant;

        let frames: String = (0..200)
            .map(|i| format!("\\n    at fn{i} (https://app.example.com/static/chunk{}.js:{i}:{})", i % 7, i * 13))
            .collect();
        let mut entries = Vec::new();
        let mut total = 2usize;
        for i in 0..MAX_ERROR_SOURCES {
            let raw = format!(r#"[{{"type":"TypeError","value":"error {i}","mechanism":"onerror","stack":"TypeError: error {i}{frames}"}}]"#);
            let entry = serde_json::json!({ "error_exceptions": raw, "count": 3 });
            let cost = serde_json::to_vec(&entry).unwrap().len() + 1;
            if total + cost > MAX_METADATA_BYTES {
                break;
            }
            total += cost;
            entries.push(entry);
        }
        let metadata = serde_json::to_vec(&entries).unwrap();
        assert!(metadata.len() <= MAX_METADATA_BYTES);

        for _ in 0..3 {
            black_box(fingerprint_metadata(black_box(&metadata), Some(u32::MAX)));
        }
        let runs = 20;
        let start = Instant::now();
        for _ in 0..runs {
            black_box(fingerprint_metadata(black_box(&metadata), Some(u32::MAX)));
        }
        let per_call = start.elapsed() / runs;
        println!(
            "metadata_timing_probe: {} bytes, {} sources, {:?} per call",
            metadata.len(),
            entries.len(),
            per_call
        );
    }
}
