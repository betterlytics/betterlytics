use std::sync::Arc;

use async_trait::async_trait;
use chrono::{DateTime, NaiveDateTime, Utc};
use tokio_postgres::Row;

use crate::postgres::{PostgresError, PostgresPool};

const BASE_SELECT: &str = r#"
SELECT
    d."siteId" AS site_id,
    d."domain" AS domain,
    sc."blacklistedIps" AS blacklisted_ips,
    sc."enforceDomain" AS enforce_domain,
    sc."updatedAt" AS updated_at
FROM "SiteConfig" sc
INNER JOIN "Dashboard" d ON d."id" = sc."dashboardId"
WHERE d."deletedAt" IS NULL
"#;

const ORDER_BY_UPDATED_AT: &str = r#" ORDER BY sc."updatedAt" ASC"#;

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
    async fn fetch_all_configs(&self) -> Result<Vec<SiteConfigRecord>, PostgresError>;
    async fn fetch_configs_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<SiteConfigRecord>, PostgresError>;
}

pub struct SiteConfigRepository {
    pool: Arc<PostgresPool>,
}

impl SiteConfigRepository {
    pub fn new(pool: Arc<PostgresPool>) -> Self {
        Self { pool }
    }

    fn all_configs_query() -> String {
        format!("{BASE_SELECT}{ORDER_BY_UPDATED_AT}")
    }

    fn configs_updated_since_query() -> String {
        format!(r#"{BASE_SELECT} AND sc."updatedAt" > $1{ORDER_BY_UPDATED_AT}"#)
    }

    fn rowset_to_records(
        rows: Vec<Row>,
    ) -> Result<Vec<SiteConfigRecord>, PostgresError> {
        rows.into_iter()
            .map(|row| SiteConfigRecord::try_from(row).map_err(PostgresError::Query))
            .collect()
    }
}

#[async_trait]
impl SiteConfigDataSource for SiteConfigRepository {
    async fn fetch_all_configs(&self) -> Result<Vec<SiteConfigRecord>, PostgresError> {
        let conn = self.pool.connection().await?;
        let rows = conn.query(&Self::all_configs_query(), &[]).await?;
        Self::rowset_to_records(rows)
    }

    async fn fetch_configs_updated_since(
        &self,
        since: DateTime<Utc>,
    ) -> Result<Vec<SiteConfigRecord>, PostgresError> {
        let conn = self.pool.connection().await?;
        let rows = conn
            .query(&Self::configs_updated_since_query(), &[&since.naive_utc()])
            .await?;
        Self::rowset_to_records(rows)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn both_queries_skip_soft_deleted_dashboards() {
        for query in [
            SiteConfigRepository::all_configs_query(),
            SiteConfigRepository::configs_updated_since_query(),
        ] {
            assert!(query.contains(r#"WHERE d."deletedAt" IS NULL"#));
            assert_eq!(query.matches("WHERE").count(), 1);
            assert!(query.ends_with(ORDER_BY_UPDATED_AT));
        }
    }

    #[test]
    fn updated_since_query_combines_with_the_deleted_filter() {
        let query = SiteConfigRepository::configs_updated_since_query();
        assert!(query.contains(r#" AND sc."updatedAt" > $1 ORDER BY"#));
    }
}
