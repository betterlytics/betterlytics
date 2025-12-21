//! Shared ClickHouse client infrastructure.
//!
//! Provides a unified `ClickHouseClient` type used by all ClickHouse-backed components.

use clickhouse::Client;

use crate::config::Config;

/// Shared ClickHouse client.
///
/// Used by components that need to query or insert into ClickHouse.
/// The underlying client is HTTP-based and handles connections on-demand.
#[derive(Clone)]
pub struct ClickHouseClient {
    client: Client,
}

impl ClickHouseClient {
    pub fn new(config: &Config) -> Self {
        let client = Client::default()
            .with_url(&config.clickhouse_url)
            .with_user(&config.clickhouse_user)
            .with_password(&config.clickhouse_password);

        Self { client }
    }

    /// Get the underlying clickhouse client for direct operations.
    pub fn inner(&self) -> &Client {
        &self.client
    }
}
