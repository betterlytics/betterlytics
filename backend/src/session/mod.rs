use chrono::{DateTime, Utc};
use moka::sync::Cache;
use once_cell::sync::Lazy;
use rand::Rng;
use std::time::Duration;

/// How long a session stays alive without activity
pub const SESSION_EXPIRY: Duration = Duration::from_secs(30 * 60);

#[derive(Clone)]
struct SessionEntry {
    session_id: u64,
    created_at: DateTime<Utc>,
}

/// A session recovered from database, used to pre-populate the cache on boot.
pub struct WarmSession {
    pub site_id: String,
    pub visitor_fingerprint: u64,
    pub session_id: u64,
    pub created_at: DateTime<Utc>,
}

/// In-memory `{site}-{fingerprint}` -> session map, expiring after `SESSION_EXPIRY` of inactivity.
struct SessionCache {
    entries: Cache<String, SessionEntry>,
}

impl SessionCache {
    fn new() -> Self {
        Self {
            entries: Cache::builder().time_to_idle(SESSION_EXPIRY).build(),
        }
    }

    /// Return the visitor's existing session, or assign a new one. On a miss, the lazily-computed
    /// `previous_fingerprint` is tried so a visitor keeps their session across a midnight salt rotation.
    fn get_or_create(
        &self,
        site_id: &str,
        visitor_fingerprint: u64,
        previous_fingerprint: impl FnOnce() -> Option<u64>,
        event_timestamp: DateTime<Utc>,
    ) -> (u64, DateTime<Utc>) {
        let cache_key = format!("{}-{}", site_id, visitor_fingerprint);

        if let Some(entry) = self.entries.get(&cache_key) {
            return (entry.session_id, entry.created_at);
        }

        if let Some(prev_fp) = previous_fingerprint() {
            if prev_fp != visitor_fingerprint {
                let previous_key = format!("{}-{}", site_id, prev_fp);
                if let Some(entry) = self.entries.get(&previous_key) {
                    return (entry.session_id, entry.created_at);
                }
            }
        }

        let entry = SessionEntry {
            session_id: rand::thread_rng().r#gen(),
            created_at: event_timestamp,
        };
        self.entries.insert(cache_key, entry.clone());
        (entry.session_id, entry.created_at)
    }

    /// Pre-populate with recovered sessions; returns the number inserted.
    fn warm(&self, sessions: impl IntoIterator<Item = WarmSession>) -> usize {
        let mut count = 0;
        for s in sessions {
            self.entries.insert(
                format!("{}-{}", s.site_id, s.visitor_fingerprint),
                SessionEntry {
                    session_id: s.session_id,
                    created_at: s.created_at,
                },
            );
            count += 1;
        }
        count
    }
}

static SESSION_CACHE: Lazy<SessionCache> = Lazy::new(SessionCache::new);

/// Resolve (or create) the session id for an event.
pub fn get_or_create_session_id(
    site_id: &str,
    visitor_fingerprint: u64,
    previous_fingerprint: impl FnOnce() -> Option<u64>,
    event_timestamp: DateTime<Utc>,
) -> (u64, DateTime<Utc>) {
    SESSION_CACHE.get_or_create(
        site_id,
        visitor_fingerprint,
        previous_fingerprint,
        event_timestamp,
    )
}

/// Pre-populate the cache with recovered sessions so they survive a restart; returns the number
/// inserted. (moka resets the idle timer on insert, so a warmed entry can outlive its real last
/// activity by up to `SESSION_EXPIRY`)
pub fn warm(sessions: impl IntoIterator<Item = WarmSession>) -> usize {
    SESSION_CACHE.warm(sessions)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn warm_session(fingerprint: u64, session_id: u64, created_at: DateTime<Utc>) -> WarmSession {
        WarmSession {
            site_id: "site".to_string(),
            visitor_fingerprint: fingerprint,
            session_id,
            created_at,
        }
    }

    #[test]
    fn warmed_session_is_reused_by_subsequent_event() {
        let cache = SessionCache::new();
        let created_at = Utc::now();

        assert_eq!(cache.warm([warm_session(1, 42, created_at)]), 1);

        let (session_id, session_start) = cache.get_or_create("site", 1, || None, Utc::now());
        assert_eq!(session_id, 42);
        assert_eq!(session_start, created_at);
    }

    #[test]
    fn previous_fingerprint_bridges_a_rotation() {
        let cache = SessionCache::new();

        let (session_a, _) = cache.get_or_create("site", 100, || None, Utc::now());
        // Current fp is now B (salt rotated), previous is A -> same session.
        let (session_b, _) = cache.get_or_create("site", 200, || Some(100), Utc::now());

        assert_eq!(session_a, session_b);
    }

    #[test]
    fn distinct_visitors_get_distinct_sessions() {
        let cache = SessionCache::new();
        let (a, _) = cache.get_or_create("site", 1, || None, Utc::now());
        let (b, _) = cache.get_or_create("site", 2, || None, Utc::now());
        assert_ne!(a, b);
    }
}
