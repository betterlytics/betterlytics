//! Shared PostgreSQL connection pool infrastructure
//!
//! Provides a unified `PostgresPool` type used by all PostgreSQL-backed repositories

use std::str::FromStr;
use std::time::Duration;

use bb8::{Pool, PooledConnection, RunError};
use bb8_postgres::PostgresConnectionManager;
use thiserror::Error;
use tokio_postgres::{Config as PgConfig, NoTls};
use tracing::info;

#[derive(Debug, Error)]
pub enum PostgresError {
    #[error("Invalid Postgres URL: {0}")]
    InvalidDatabaseUrl(String),
    #[error("Failed to get Postgres connection from pool: {0}")]
    Pool(#[from] RunError<tokio_postgres::Error>),
    #[error("Postgres query failed: {0}")]
    Query(#[from] tokio_postgres::Error),
}

pub struct PostgresPool {
    pool: Pool<PostgresConnectionManager<NoTls>>,
}

impl PostgresPool {
    pub async fn new(
        database_url: &str,
        application_name: &str,
        max_connections: u32,
    ) -> Result<Self, PostgresError> {
        let mut config = PgConfig::from_str(database_url)
            .map_err(|e| PostgresError::InvalidDatabaseUrl(e.to_string()))?;
        config.connect_timeout(Duration::from_secs(5));
        config.application_name(application_name);

        let manager = PostgresConnectionManager::new(config, NoTls);
        let pool = Pool::builder()
            .max_size(max_connections)
            .connection_timeout(Duration::from_secs(5))
            .build(manager)
            .await?;

        info!(
            application_name = application_name,
            max_connections = max_connections,
            "PostgreSQL pool initialized"
        );

        Ok(Self { pool })
    }

    pub async fn connection(
        &self,
    ) -> Result<PooledConnection<'_, PostgresConnectionManager<NoTls>>, PostgresError> {
        Ok(self.pool.get().await?)
    }
}
