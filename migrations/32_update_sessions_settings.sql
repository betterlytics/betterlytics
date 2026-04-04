ALTER TABLE analytics.sessions
    MODIFY SETTING min_rows_for_wide_part = 0, min_bytes_for_wide_part = 0;

ALTER TABLE analytics.sessions ADD INDEX idx_session_end session_end TYPE minmax GRANULARITY 4;

ALTER TABLE analytics.sessions MATERIALIZE INDEX idx_session_end;

OPTIMIZE TABLE analytics.sessions FINAL;
