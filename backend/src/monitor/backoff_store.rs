use std::time::Duration as StdDuration;

use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::Deserialize;

use crate::clickhouse::ClickHouseClient;
use crate::monitor::{BackoffSeed, BackoffSeeds};

#[derive(clickhouse::Row, Deserialize)]
struct BackoffSeedRow {
    check_id: String,
    #[serde(with = "clickhouse::serde::chrono::datetime64::millis")]
    ts: DateTime<Utc>,
    backoff_level: u8,
}

/// Reads the backoff level from each check's latest result within `lookback`. SSL
/// certificate rows share the table but always record level 0, so they are left out.
pub async fn load_backoff_seeds(
    clickhouse: &ClickHouseClient,
    table: &str,
    check_ids: &[String],
    lookback: StdDuration,
) -> Result<BackoffSeeds> {
    if check_ids.is_empty() {
        return Ok(BackoffSeeds::new());
    }

    let query = format!(
        r#"
        SELECT
            check_id,
            ts,
            backoff_level
        FROM {table}
        WHERE check_id IN {{check_ids:Array(String)}}
          AND kind != 'tls'
          AND ts >= subtractSeconds(now64(3), {{lookback_secs:UInt32}})
        ORDER BY check_id, ts DESC
        LIMIT 1 BY check_id
        "#
    );

    let rows: Vec<BackoffSeedRow> = clickhouse
        .inner()
        .query(&query)
        .param("check_ids", check_ids)
        .param("lookback_secs", lookback.as_secs())
        .fetch_all()
        .await?;

    Ok(rows
        .into_iter()
        .map(|row| {
            let seed = BackoffSeed {
                ts: row.ts,
                backoff_level: row.backoff_level,
            };
            (row.check_id, seed)
        })
        .collect())
}
