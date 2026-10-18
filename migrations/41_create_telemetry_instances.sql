CREATE TABLE IF NOT EXISTS analytics.telemetry_pings (
    instance_id UUID,
    version String,
    received_at DateTime
) ENGINE = Null;

CREATE TABLE IF NOT EXISTS analytics.telemetry_instances (
    instance_id UUID,
    first_seen SimpleAggregateFunction(min, DateTime),
    last_seen SimpleAggregateFunction(max, DateTime),
    first_version SimpleAggregateFunction(min, Tuple(DateTime, String)),
    current_version SimpleAggregateFunction(max, Tuple(DateTime, String))
) ENGINE = AggregatingMergeTree()
ORDER BY instance_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.telemetry_instances_mv TO analytics.telemetry_instances AS
SELECT
    instance_id,
    min(received_at) AS first_seen,
    max(received_at) AS last_seen,
    min(tuple(received_at, version)) AS first_version,
    max(tuple(received_at, version)) AS current_version
FROM analytics.telemetry_pings
GROUP BY instance_id;
