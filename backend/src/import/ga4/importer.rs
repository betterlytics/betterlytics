use chrono::{DateTime, Utc};
use clickhouse::Row;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ga4Event {
    pub name: String,
    pub timestamp: DateTime<Utc>,
    pub user_id: Option<String>,
    pub session_id: Option<String>,
    pub params: Option<serde_json::Value>,
    pub idempotency_key: Option<String>,
}

#[derive(Row, Serialize, Deserialize, Debug)]
pub struct InternalEvent {
    site_id: i64,
    event_name: String,
    event_timestamp: i64,
    user_id: Option<String>,
    session_id: Option<String>,
    properties: serde_json::Value,
    idempotency_key: Option<String>,
}

pub async fn import_ga4_events(
    site_id: i64,
    events: Vec<Ga4Event>,
    client: &clickhouse::Client,
) -> Result<(), Box<dyn std::error::Error>> {
    const CHUNK_SIZE: usize = 10000;
    for chunk in events.chunks(CHUNK_SIZE) {
        let mut internal_events = Vec::with_capacity(chunk.len());
        for event in chunk {
            internal_events.push(convert_to_internal(site_id, event));
        }
        let mut insert = client.insert("events")?;
        for event in internal_events {
            insert.write(&event).await?;
        }
        insert.end().await?;
    }
    Ok(())
}

fn convert_to_internal(site_id: i64, event: &Ga4Event) -> InternalEvent {
    InternalEvent {
        site_id,
        event_name: event.name.clone(),
        event_timestamp: event.timestamp.timestamp_millis(),
        user_id: event.user_id.clone(),
        session_id: event.session_id.clone(),
        properties: event.params.clone().unwrap_or_else(|| serde_json::Value::Object(serde_json::Map::new())),
        idempotency_key: event.idempotency_key.clone(),
    }
}
