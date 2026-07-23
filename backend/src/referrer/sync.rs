use anyhow::Result;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::db::{Database, ReferrerSourceCategoryRow};

use super::source_categories::build_referrer_source_categories;

pub async fn sync_referrer_categories(
    db: &Database,
    snowplow_path: &Path,
    ga4_path: &Path,
    custom_path: &Path,
) -> Result<()> {
    if !db.referrer_dictionary_ready().await? {
        tracing::warn!(
            "Referrer source category dictionary tables are missing; skipping sync. Run migrations first."
        );
        return Ok(());
    }

    let categories = build_referrer_source_categories(snowplow_path, ga4_path, custom_path)?;
    let category_count = categories.len();
    let generation = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();

    let rows = categories
        .into_iter()
        .map(|category| ReferrerSourceCategoryRow {
            generation,
            key: category.key,
            medium: category.medium,
        })
        .collect();

    db.write_referrer_categories(rows).await?;

    tracing::info!(
        "Referrer source category dictionary synced ({} categories, generation {})",
        category_count,
        generation
    );
    Ok(())
}
