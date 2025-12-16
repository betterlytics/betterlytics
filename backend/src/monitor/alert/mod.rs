//! Monitor alerting module
//!
//! This module handles alert notifications for monitor status changes.
//! It provides:
//! - State tracking to prevent duplicate alerts
//! - Email delivery via MailerSend API
//! - Alert history recording to PostgreSQL
//! - Alert orchestration service

pub mod email;
pub mod history;
pub mod service;
pub mod tracker;

pub use history::{AlertHistoryWriter};
pub use service::{AlertContext, AlertService, AlertServiceConfig};
