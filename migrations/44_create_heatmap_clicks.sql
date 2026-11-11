-- One row per heatmap click. No TTL: like events, clicks are deleted by the
-- per-dashboard retention purge. Visitor attributes such as country and
-- browser are not copied here; heatmap queries join the session on session_id.
CREATE TABLE IF NOT EXISTS analytics.heatmap_clicks (
    site_id LowCardinality(String),
    session_id UInt64,
    visitor_id UInt64,
    url String,
    device LowCardinality(String),
    viewport_width UInt16,
    document_height UInt32,
    page_x UInt32,
    page_y UInt32,
    selector String,
    offset_x Float32,
    offset_y Float32,
    is_fixed Bool,
    timestamp DateTime
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (site_id, device, url, timestamp)
SETTINGS non_replicated_deduplication_window = 100;
