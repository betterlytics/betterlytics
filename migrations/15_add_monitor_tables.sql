CREATE TABLE IF NOT EXISTS analytics.monitor_results
(
    ts            DateTime64(3) DEFAULT now(),
    check_id      String,
    site_id       String,
    kind          LowCardinality(String),
    status        Enum8('ok' = 1, 'warn' = 2, 'failed' = 3),
    reason_code   LowCardinality(String),      -- e.g. ok, http_4xx, http_5xx, timeout, network_error, tls_error
    latency_ms    Nullable(Float64),
    status_code   Nullable(UInt16),          -- HTTP/HTTPS only
    http_method   LowCardinality(String) DEFAULT 'HEAD', -- HEAD or GET
    resolved_ip   Nullable(String),
    port          Nullable(UInt16),          -- for TCP/HTTP checks
    tls_not_after Nullable(DateTime64(3)),   -- SSL expiry; null if not applicable

    effective_interval_seconds UInt16 DEFAULT 30,
    backoff_level              UInt8  DEFAULT 0,
    consecutive_failures       UInt16 DEFAULT 0,
    consecutive_successes      UInt16 DEFAULT 0,
    backoff_reason             Enum8(
        'none'          = 0,
        'failure'       = 1,
        'manual'        = 2,
        'rate_limited'  = 3
    ) DEFAULT 'none',

    extra         String,                    -- JSON for optional details (issuer/SAN/etc.)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (check_id, ts)
SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS analytics.monitor_incidents
(
    incident_id   UUID,
    check_id      String,
    site_id       String,

    state Enum8(
        'ongoing'   = 1,
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

    last_status   Enum8('ok' = 1, 'warn' = 2, 'failed' = 3),
    status_code   Nullable(UInt16),

    notified_down_at     Nullable(DateTime64(3)),
    notified_resolve_at  Nullable(DateTime64(3)),
    last_ssl_milestone_notified Nullable(Int32),

    kind LowCardinality(String)
)
ENGINE = ReplacingMergeTree(last_event_at)
ORDER BY (check_id, incident_id);

CREATE TABLE IF NOT EXISTS analytics.monitor_alert_history
(
    ts            DateTime64(3) DEFAULT now(),
    check_id      String,
    site_id       String,
    alert_type    LowCardinality(String),  -- down, recovery, ssl_expiring, ssl_expired
    sent_to       Array(String),
    status_code   Nullable(Int32),
    latency_ms    Nullable(Int32),
    ssl_days_left Nullable(Int32)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (site_id, check_id, ts)
TTL ts + INTERVAL 365 DAY;
