use std::str::FromStr;
use std::time::Duration;

use async_trait::async_trait;
use bb8::{Pool, PooledConnection, RunError};
use bb8_postgres::PostgresConnectionManager;
use chrono::{DateTime, NaiveDateTime, Utc};
use thiserror::Error;
use tokio_postgres::{Config as PgConfig, NoTls, Row};

const BASE_SELECT: &str = r#"
SELECT
    d."siteId" AS site_id,
    d."domain" AS domain,
    sc."blacklistedIps" AS blacklisted_ips,
    sc."enforceDomain" AS enforce_domain,
    sc."updatedAt" AS updated_at
FROM "SiteConfig" sc
INNER JOIN "Dashboard" d ON d."id" = sc."dashboardId"
"#;

const ORDER_BY_UPDATED_AT: &str = r#" ORDER BY sc."updatedAt" ASC"#;

#[derive(Debug, Error)]
pub enum SiteConfigRepositoryError {
    #[error("Invalid Postgres URL: {0}")]
    InvalidDatabaseUrl(String),
    #[error("Failed to get Postgres connection from pool: {0}")]
    Pool(#[from] RunError<tokio_postgres::Error>),
    #[error("Postgres query failed: {0}")]
    Query(#[from] tokio_postgres::Error),
}

#[derive(Clone, Debug)]
pub struct SiteConfigRecord {
    pub site_id: String,
    pub domain: String,
    pub blacklisted_ips: Vec<String>,
    pub enforce_domain: bool,
    pub updated_at: DateTime<Utc>,
}

impl TryFrom<Row> for SiteConfigRecord {
    type Error = tokio_postgres::Error;

    fn try_from(row: Row) -> Result<Self, Self::Error> {
        let updated_at: NaiveDateTime = row.try_get("updated_at")?;
        Ok(Self {
            site_id: row.try_get("site_id")?,
            domain: row.try_get("domain")?,
            blacklisted_ips: row.try_get("blacklisted_ips")?,
            enforce_domain: row.try_get("enforce_domain")?,
            updated_at: DateTime::<Utc>::from_naive_utc_and_offset(updated_at, Utc),
        })
    }
}

#[async_trait]
pub trait SiteConfigDataSource: Send + Sync + 'static {
    async fn fetch_all_configs(&self) -> Result<Vec<SiteConfigRecord>, SiteConfigRepositoryError>;
    async fn fetch_configs_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<SiteConfigRecord>, SiteConfigRepositoryError>;
}

pub struct SiteConfigRepository {
    pool: Pool<PostgresConnectionManager<NoTls>>,
}

impl SiteConfigRepository {
    pub async fn new(database_url: &str) -> Result<Self, SiteConfigRepositoryError> {
        let mut config =
            PgConfig::from_str(database_url).map_err(|e| SiteConfigRepositoryError::InvalidDatabaseUrl(e.to_string()))?;
        config.connect_timeout(Duration::from_secs(5));
        config.application_name("betterlytics_site_config_cache");

        let manager = PostgresConnectionManager::new(config, NoTls);
        let pool = Pool::builder().max_size(5).build(manager).await?;

        Ok(Self { pool })
    }

    async fn connection(
        &self,
    ) -> Result<PooledConnection<'_, PostgresConnectionManager<NoTls>>, SiteConfigRepositoryError> {
        Ok(self.pool.get().await?)
    }

    fn rowset_to_records(
        rows: Vec<Row>,
    ) -> Result<Vec<SiteConfigRecord>, SiteConfigRepositoryError> {
        rows.into_iter()
            .map(|row| SiteConfigRecord::try_from(row).map_err(SiteConfigRepositoryError::Query))
            .collect()
    }
}

#[async_trait]
impl SiteConfigDataSource for SiteConfigRepository {
    async fn fetch_all_configs(&self) -> Result<Vec<SiteConfigRecord>, SiteConfigRepositoryError> {
        let conn = self.connection().await?;
        let query = format!("{BASE_SELECT}{ORDER_BY_UPDATED_AT}");
        let rows = conn.query(&query, &[]).await?;
        Self::rowset_to_records(rows)
    }

    async fn fetch_configs_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<SiteConfigRecord>, SiteConfigRepositoryError> {
        let conn = self.connection().await?;
        let query = format!(
            r#"{BASE_SELECT} WHERE sc."updatedAt" > $1{ORDER_BY_UPDATED_AT}"#
        );
        let rows = conn
            .query(&query, &[&since.naive_utc()])
            .await?;
        Self::rowset_to_records(rows)
    }
}


