-- The backend retries failed insert batches (at-least-once delivery), so an
-- insert whose acknowledgement timed out can land twice. Remember the last 100
-- insert blocks (compared by insert_deduplication_token, which the backend
-- sends per batch) so retried batches are silently ignored instead of
-- duplicating events. Metadata-only change; no data rewrite.
ALTER TABLE analytics.events
    MODIFY SETTING non_replicated_deduplication_window = 100;
