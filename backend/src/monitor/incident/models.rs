use chrono::{DateTime, Utc};
use serde_repr::{Deserialize_repr, Serialize_repr};
use uuid::Uuid;

use crate::monitor::{MonitorStatus, ReasonCode};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize_repr, Deserialize_repr)]
#[repr(i8)]
pub enum IncidentState {
    Ongoing = 1,
    Resolved = 2,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize_repr, Deserialize_repr)]
#[repr(i8)]
pub enum IncidentSeverity {
    Info = 1,
    Warning = 2,
    Critical = 3,
}


#[derive(Clone, Debug)]
pub struct IncidentSnapshot {
    pub incident_id: Option<Uuid>,
    pub state: IncidentState,
    pub severity: IncidentSeverity,
    pub started_at: Option<DateTime<Utc>>,
    pub last_event_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub failure_count: u16,
    pub last_status: Option<MonitorStatus>,
    pub last_error_reason_code: Option<ReasonCode>,
    pub last_error_status_code: Option<u16>,
}