-- Drop legacy tables left behind by previous schema migrations
DROP TABLE IF EXISTS analytics.events_old;
DROP TABLE IF EXISTS analytics.events_old_2;
DROP TABLE IF EXISTS analytics.session_replays_old;
DROP TABLE IF EXISTS analytics.session_replays_old_2;
