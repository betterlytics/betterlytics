CREATE TABLE IF NOT EXISTS analytics.monitor_results
(
    ts            DateTime64(3) DEFAULT now(),
    check_id      String,
    site_id       String,
    kind          LowCardinality(String),
    status        Enum8('ok' = 1, 'warn' = 2, 'down' = 3, 'error' = 4),
    reason_code   LowCardinality(String),      -- e.g. ok, http_4xx, http_5xx, timeout, network_error, tls_error
    latency_ms    Nullable(Float64),
    status_code   Nullable(UInt16),          -- HTTP/HTTPS only
    resolved_ip   Nullable(IPv6),
    port          Nullable(UInt16),          -- for TCP/HTTP checks
    tls_not_after Nullable(DateTime64(3)),   -- SSL expiry; null if not applicable
    tls_days_left Nullable(Int32),

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

    error         String,
    extra         String,                    -- JSON for optional details (issuer/SAN/etc.)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (check_id, ts)
SETTINGS index_granularity = 8192;
