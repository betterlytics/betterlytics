//! Monitor alerting module
//!
//! This module handles alert notifications for monitor status changes.
//! It provides:
//! - State tracking to prevent duplicate alerts
//! - Email delivery via MailerSend API
//! - Alert history recording to ClickHouse
//! - Alert dispatch coordination

pub mod dispatcher;
pub mod email;
pub mod notification_tracker;
pub mod repository;

pub use dispatcher::{Alert, AlertContext, AlertDispatcher, AlertDispatcherConfig};
pub use notification_tracker::NotificationTracker;
pub use repository::{new_alert_history_writer, AlertHistoryWriter};