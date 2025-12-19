CREATE TABLE IF NOT EXISTS analytics.monitor_incidents
(
    incident_id   UUID,
    check_id      String,
    site_id       String,

    state Enum8(
        'open'      = 1,
        'resolved'  = 2
    ),

    severity Enum8(
        'info'     = 1,
        'warning'  = 2,
        'critical' = 3
    ),

    started_at    DateTime64(3),
    last_event_at DateTime64(3),
    resolved_at   Nullable(DateTime64(3)),

    reason_code   LowCardinality(String),

    failure_count UInt16,
    flap_count    UInt16,

    last_status   Enum8('ok' = 1, 'warn' = 2, 'down' = 3, 'error' = 4),
    status_code   Nullable(UInt16),
    error_message String,

    notified_down_at     Nullable(DateTime64(3)),
    notified_flap_at     Nullable(DateTime64(3)),
    notified_resolve_at  Nullable(DateTime64(3)),

    kind LowCardinality(String)
)
ENGINE = ReplacingMergeTree(last_event_at)
ORDER BY (check_id, incident_id);
