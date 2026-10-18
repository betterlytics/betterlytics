use axum::{extract::State, http::StatusCode, Json};
use chrono::Utc;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::Deserialize;
use tracing::{debug, error};
use uuid::Uuid;

use crate::db::{SharedDatabase, TelemetryPingRow};

// [0-9] rather than \d: regex-crate \d matches Unicode digits, the dashboard's JS regex does not
static VERSION_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^v?[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}(-[0-9A-Za-z.-]{1,40})?$").unwrap());
const MAX_VERSION_LEN: usize = 48;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TelemetryPing {
    pub instance_id: Uuid,
    pub version: String,
}

pub fn is_valid_ping(ping: &TelemetryPing) -> bool {
    ping.instance_id.get_version_num() == 4
        && ping.version.len() <= MAX_VERSION_LEN
        && VERSION_RE.is_match(&ping.version)
}

pub async fn receive_telemetry(
    State(db): State<SharedDatabase>,
    Json(ping): Json<TelemetryPing>,
) -> StatusCode {
    if !is_valid_ping(&ping) {
        debug!("Telemetry ping rejected by validation");
        return StatusCode::UNPROCESSABLE_ENTITY;
    }
    let row = TelemetryPingRow {
        date: Utc::now().date_naive(),
        instance_id: ping.instance_id,
        version: ping.version,
    };
    match db.insert_telemetry_ping(row).await {
        Ok(()) => StatusCode::NO_CONTENT,
        Err(e) => {
            error!("Telemetry ping insert failed: {}", e);
            StatusCode::SERVICE_UNAVAILABLE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const V4_ID: &str = "9b2f6c1e-3a4d-4e5f-8a6b-7c8d9e0f1a2b";

    fn ping(instance_id: &str, version: &str) -> TelemetryPing {
        TelemetryPing {
            instance_id: Uuid::parse_str(instance_id).unwrap(),
            version: version.to_string(),
        }
    }

    #[test]
    fn accepts_release_and_prerelease_versions() {
        for version in ["v1.5.1", "1.5.1", "v1.5.1-rc.1", "v1.3.0-hotfix-1.0"] {
            assert!(is_valid_ping(&ping(V4_ID, version)), "{version} should be accepted");
        }
    }

    #[test]
    fn rejects_malformed_versions() {
        let too_long = format!("v1.0.0-{}", "a".repeat(42));
        assert_eq!(too_long.len(), 49);
        for version in ["dev", "v1.5", "v١.٢.٣", too_long.as_str()] {
            assert!(!is_valid_ping(&ping(V4_ID, version)), "{version} should be rejected");
        }
    }

    #[test]
    fn rejects_non_v4_instance_id() {
        assert!(!is_valid_ping(&ping("6ba7b810-9dad-11d1-80b4-00c04fd430c8", "v1.5.1")));
    }

    #[test]
    fn rejects_unknown_fields() {
        let body = format!(r#"{{"instance_id":"{V4_ID}","version":"v1.5.1","ip":"1.2.3.4"}}"#);
        assert!(serde_json::from_str::<TelemetryPing>(&body).is_err());
    }

    #[test]
    fn accepts_exact_payload() {
        let body = format!(r#"{{"instance_id":"{V4_ID}","version":"v1.5.1"}}"#);
        assert!(serde_json::from_str::<TelemetryPing>(&body).is_ok());
    }
}
