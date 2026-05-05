use anyhow::Result;
use serde::Deserialize;
use std::collections::{HashMap, HashSet};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReferrerSourceCategory {
    pub key: String,
    pub medium: String,
}

#[derive(Debug, Deserialize)]
struct ReferrerJsonEntry {
    #[serde(default)]
    domains: Vec<String>,
}

type ReferrerJson = HashMap<String, HashMap<String, ReferrerJsonEntry>>;

pub fn build_referrer_source_categories(
    snowplow_path: &Path,
    ga4_path: &Path,
    custom_path: &Path,
) -> Result<Vec<ReferrerSourceCategory>> {
    let mut categories = HashMap::new();
    merge_referrer_categories(&mut categories, snowplow_path, true)?;
    merge_ga4_source_categories(&mut categories, ga4_path)?;
    merge_referrer_categories(&mut categories, custom_path, false)?;

    Ok(categories
        .into_iter()
        .map(|(key, medium)| ReferrerSourceCategory { key, medium })
        .collect())
}

fn merge_referrer_categories(
    categories: &mut HashMap<String, String>,
    path: &Path,
    required: bool,
) -> Result<()> {
    if !path.exists() {
        if required {
            anyhow::bail!("Referrer database file does not exist: {:?}", path);
        }
        tracing::warn!("Custom referrer file does not exist: {:?}; skipping", path);
        return Ok(());
    }

    let contents = std::fs::read_to_string(path)?;
    let parsed: ReferrerJson = serde_json::from_str(&contents)?;
    let ambiguous_source_names = ambiguous_source_names(&parsed);

    for (medium, sources) in parsed {
        let medium = normalize_referrer_medium(&medium);
        for (source_name, entry) in sources {
            if !ambiguous_source_names.contains(&source_name) {
                insert_referrer_category_key(categories, source_name, &medium);
            }

            for domain in entry.domains {
                let normalized = normalize_referrer_key(&domain);
                if normalized.is_empty() {
                    continue;
                }

                insert_referrer_category_key(categories, normalized, &medium);
            }
        }
    }

    Ok(())
}

fn ambiguous_source_names(parsed: &ReferrerJson) -> HashSet<String> {
    let mut source_mediums: HashMap<&str, String> = HashMap::new();
    let mut ambiguous = HashSet::new();

    for (medium, sources) in parsed {
        let medium = normalize_referrer_medium(medium);
        for source_name in sources.keys() {
            if let Some(existing_medium) = source_mediums.get(source_name.as_str()) {
                if existing_medium != &medium {
                    ambiguous.insert(source_name.clone());
                }
            } else {
                source_mediums.insert(source_name.as_str(), medium.clone());
            }
        }
    }

    ambiguous
}

fn insert_referrer_category_key(
    categories: &mut HashMap<String, String>,
    key: String,
    medium: &str,
) {
    if key.is_empty() {
        return;
    }

    categories.insert(key, medium.to_string());
}

fn insert_referrer_category_key_if_absent(
    categories: &mut HashMap<String, String>,
    key: String,
    medium: &str,
) {
    if key.is_empty() {
        return;
    }

    categories.entry(key).or_insert_with(|| medium.to_string());
}

fn merge_ga4_source_categories(
    categories: &mut HashMap<String, String>,
    path: &Path,
) -> Result<()> {
    if !path.exists() {
        tracing::warn!("GA4 source categories file does not exist: {:?}; skipping", path);
        return Ok(());
    }

    let contents = std::fs::read_to_string(path)?;

    for (index, line) in contents.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() || index == 0 {
            continue;
        }

        let Some((source, category)) = line.split_once(',') else {
            tracing::warn!("Skipping invalid GA4 source category row {}: {}", index + 1, line);
            continue;
        };

        let medium = normalize_ga4_source_category(category.trim());
        let key = normalize_referrer_key(source);
        insert_referrer_category_key_if_absent(categories, key, &medium);
    }

    Ok(())
}

fn normalize_referrer_key(key: &str) -> String {
    let lowercase = key.to_lowercase();
    let without_scheme = lowercase
        .trim()
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .trim_end_matches('/');
    without_scheme
        .strip_prefix("www.")
        .unwrap_or(without_scheme)
        .to_string()
}

fn normalize_referrer_medium(medium: &str) -> String {
    match medium {
        "search" | "social" | "email" | "internal" => medium.to_string(),
        _ => "other".to_string(),
    }
}

fn normalize_ga4_source_category(category: &str) -> String {
    match category {
        "SOURCE_CATEGORY_SEARCH" => "search".to_string(),
        "SOURCE_CATEGORY_SOCIAL" => "social".to_string(),
        "SOURCE_CATEGORY_EMAIL" => "email".to_string(),
        _ => "other".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn ga4_source_categories_fill_missing_keys_without_overriding_existing_ones() {
        let path = std::env::temp_dir().join(format!(
            "betterlytics-ga4-source-categories-{}.csv",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
        ));

        fs::write(
            &path,
            "source,source category\nmail.google.com,SOURCE_CATEGORY_SEARCH\nawe.sm,SOURCE_CATEGORY_SOCIAL\n",
        ).unwrap();

        let mut categories = HashMap::new();
        insert_referrer_category_key(&mut categories, "mail.google.com".to_string(), "email");

        merge_ga4_source_categories(&mut categories, &path).unwrap();

        fs::remove_file(&path).unwrap();

        assert_eq!(categories.get("mail.google.com").map(String::as_str), Some("email"));
        assert_eq!(categories.get("awe.sm").map(String::as_str), Some("social"));
    }

    #[test]
    fn build_categories_merges_snowplow_ga4_and_custom_sources() {
        let suffix = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let snowplow_path = std::env::temp_dir().join(format!(
            "betterlytics-snowplow-referrers-{suffix}.json"
        ));
        let ga4_path = std::env::temp_dir().join(format!(
            "betterlytics-ga4-source-categories-{suffix}.csv"
        ));
        let custom_path = std::env::temp_dir().join(format!(
            "betterlytics-custom-referrers-{suffix}.json"
        ));

        fs::write(
            &snowplow_path,
            r#"{
                "email": {
                    "Gmail": { "domains": ["mail.google.com"] }
                },
                "search": {
                    "Google": { "domains": ["google.com"] }
                }
            }"#,
        ).unwrap();
        fs::write(
            &ga4_path,
            "source,source category\nmail.google.com,SOURCE_CATEGORY_SEARCH\nawe.sm,SOURCE_CATEGORY_SOCIAL\n",
        ).unwrap();
        fs::write(
            &custom_path,
            r#"{
                "social": {
                    "Discord": { "domains": ["discord.com"] }
                },
                "search": {
                    "Custom Gmail": { "domains": ["mail.google.com"] }
                }
            }"#,
        ).unwrap();

        let categories = build_referrer_source_categories(&snowplow_path, &ga4_path, &custom_path)
            .unwrap()
            .into_iter()
            .map(|category| (category.key, category.medium))
            .collect::<HashMap<_, _>>();

        fs::remove_file(&snowplow_path).unwrap();
        fs::remove_file(&ga4_path).unwrap();
        fs::remove_file(&custom_path).unwrap();

        assert_eq!(categories.get("google.com").map(String::as_str), Some("search"));
        assert_eq!(categories.get("awe.sm").map(String::as_str), Some("social"));
        assert_eq!(categories.get("discord.com").map(String::as_str), Some("social"));
        assert_eq!(categories.get("mail.google.com").map(String::as_str), Some("search"));
    }

    #[test]
    fn ambiguous_source_names_are_not_inserted_as_canonical_keys() {
        let path = std::env::temp_dir().join(format!(
            "betterlytics-ambiguous-referrers-{}.json",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
        ));

        fs::write(
            &path,
            r#"{
                "unknown": {
                    "Google": { "domains": ["support.google.com"] }
                },
                "search": {
                    "Google": { "domains": ["google.com"] }
                },
                "email": {
                    "Gmail": { "domains": ["mail.google.com"] }
                }
            }"#,
        ).unwrap();

        let mut categories = HashMap::new();
        merge_referrer_categories(&mut categories, &path, true).unwrap();

        fs::remove_file(&path).unwrap();

        assert_eq!(categories.get("Google"), None);
        assert_eq!(categories.get("google.com").map(String::as_str), Some("search"));
        assert_eq!(categories.get("support.google.com").map(String::as_str), Some("other"));
        assert_eq!(categories.get("Gmail").map(String::as_str), Some("email"));
    }

    #[test]
    fn ga4_source_category_mapping_only_promotes_supported_channels() {
        assert_eq!(normalize_ga4_source_category("SOURCE_CATEGORY_SEARCH"), "search");
        assert_eq!(normalize_ga4_source_category("SOURCE_CATEGORY_SOCIAL"), "social");
        assert_eq!(normalize_ga4_source_category("SOURCE_CATEGORY_EMAIL"), "email");
        assert_eq!(normalize_ga4_source_category("SOURCE_CATEGORY_SHOPPING"), "other");
        assert_eq!(normalize_ga4_source_category("SOURCE_CATEGORY_VIDEO"), "other");
    }
}
