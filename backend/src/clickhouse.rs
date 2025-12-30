//! Shared ClickHouse client infrastructure.
//!
//! Provides a unified `ClickHouseClient` type used by all ClickHouse-backed components.

use clickhouse::Client;

use crate::config::Config;

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

    pub fn inner(&self) -> &Client {
        &self.client
    }
}
