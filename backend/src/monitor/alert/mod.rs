//! Monitor alerting module
//!
//! This module handles alert notifications for monitor status changes.
//! It provides:
//! - State tracking to prevent duplicate alerts
//! - Email delivery via MailerSend API
//! - Alert history recording to ClickHouse
//! - Alert orchestration service

pub mod email;
pub mod repository;
pub mod service;
pub mod tracker;

pub use repository::{new_alert_history_writer};
pub use service::{AlertContext, AlertService, AlertServiceConfig};
