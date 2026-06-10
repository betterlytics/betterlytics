//! Visitor identification: turns request attributes into a salted fingerprint and a session id

use anyhow::Result;
use chrono::{DateTime, Utc};

use crate::analytics::{VisitorAttrs, generate_fingerprint};
use crate::salt;
use crate::session;

/// The identity assigned to an incoming event
pub struct VisitorIdentity {
    /// Salted, daily-rotating visitor fingerprint
    pub fingerprint: u64,
    pub session_id: u64,
    pub session_created_at: DateTime<Utc>,
}

/// Compute the visitor fingerprint and resolve the session
pub fn identify(
    site_id: &str,
    attrs: &VisitorAttrs<'_>,
    event_timestamp: DateTime<Utc>,
) -> Result<VisitorIdentity> {
    let (current_salt, previous_salt) = salt::current_and_previous();

    let fingerprint = generate_fingerprint(&current_salt, attrs);

    let (session_id, session_created_at) = session::get_or_create_session_id(
        site_id,
        fingerprint,
        || previous_salt.as_ref().map(|s| generate_fingerprint(s, attrs)),
        event_timestamp,
    )?;

    Ok(VisitorIdentity {
        fingerprint,
        session_id,
        session_created_at,
    })
}
