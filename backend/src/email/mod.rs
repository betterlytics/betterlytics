//! Email service module.
//!
//! Provides a generic email service for sending emails via MailerSend,
//! along with base template components for building consistent emails.

mod service;
pub mod templates;

pub use service::{EmailRequest, EmailService};
