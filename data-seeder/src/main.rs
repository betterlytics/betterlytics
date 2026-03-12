use chrono::{DateTime, NaiveDate, TimeZone, Utc};
use clickhouse::{Client, Row};
use rand::{rngs::SmallRng, seq::SliceRandom, Rng, SeedableRng};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::{
    env,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::Instant,
};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
enum EventType {
    Pageview = 1,
    Custom = 2,
    OutboundLink = 3,
    Cwv = 4,
    ScrollDepth = 5,
}

#[derive(Row, Serialize, Deserialize, Debug, Clone)]
struct EventRow {
    site_id: String,
    visitor_id: String,
    session_id: String,
    domain: String,
    url: String,
    device_type: String,
    country_code: Option<String>,
    #[serde(with = "clickhouse::serde::chrono::datetime")]
    timestamp: DateTime<Utc>,
    #[serde(with = "clickhouse::serde::chrono::date")]
    date: NaiveDate,
    browser: String,
    browser_version: String,
    os: String,
    os_version: String,
    referrer_source: String,
    referrer_source_name: String,
    referrer_search_term: String,
    referrer_url: String,
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_term: String,
    utm_content: String,
    event_type: EventType,
    custom_event_name: String,
    custom_event_json: String,
    outbound_link_url: String,
    cwv_cls: Option<f32>,
    cwv_lcp: Option<f32>,
    cwv_inp: Option<f32>,
    cwv_fcp: Option<f32>,
    cwv_ttfb: Option<f32>,
    scroll_depth_percentage: Option<f32>,
    scroll_depth_pixels: Option<f32>,
}

#[derive(Debug, Clone)]
struct Config {
    site_id: String,
    domain: String,
    total_rows: u64,
    workers: usize,
    batch_size: usize,
    visitor_pool_size: usize,
    days: i64,
    clickhouse_url: String,
    clickhouse_user: String,
    clickhouse_password: String,
}

fn parse_args() -> Result<Config, String> {
    let _ = dotenv::from_filename("../.env");

    let args: Vec<String> = env::args().collect();

    let flag = |name: &str| -> Option<String> {
        let prefix = format!("--{}=", name);
        args.iter().find(|a| a.starts_with(&prefix)).map(|a| a[prefix.len()..].to_string())
    };
    let num = |name: &str, default: &str| -> Result<u64, String> {
        flag(name).unwrap_or_else(|| default.to_string()).parse().map_err(|_| format!("Invalid --{}", name))
    };

    if args.len() < 2 || args[1].starts_with("--") {
        return Err(format!(
            "Usage: {} <SITE_ID> [OPTIONS]\n\n\
             Options:\n  \
             --domain=<DOMAIN>   Website domain               (default: site_id)\n  \
             --rows=<N>          Total rows to insert         (default: 100_000_000)\n  \
             --workers=<N>       Parallel insert workers      (default: 8)\n  \
             --batch-size=<N>    Rows per batch               (default: 50_000)\n  \
             --visitors=<N>      Unique visitor pool size     (default: 100_000)\n  \
             --days=<N>          History in days from now     (default: 365)\n  \
             --url=<URL>         ClickHouse URL               (env: CLICKHOUSE_URL)\n  \
             --user=<USER>       ClickHouse user              (env: CLICKHOUSE_BACKEND_USER)\n  \
             --password=<PASS>   ClickHouse password          (env: CLICKHOUSE_BACKEND_PASSWORD)\n\n\
             Example:\n  {} my-site-id --domain=example.com --rows=10000000 --workers=16 --days=365",
            args[0], args[0],
        ));
    }

    let env_url = env::var("CLICKHOUSE_URL").unwrap_or_else(|_| "http://localhost:8123".to_string());
    let env_user = env::var("CLICKHOUSE_BACKEND_USER").unwrap_or_else(|_| "default".to_string());
    let env_password = env::var("CLICKHOUSE_BACKEND_PASSWORD").unwrap_or_else(|_| "password".to_string());

    Ok(Config {
        site_id: args[1].clone(),
        domain: flag("domain").unwrap_or_else(|| args[1].clone()),
        total_rows: num("rows", "100000000")?,
        workers: flag("workers").unwrap_or_else(|| "8".to_string()).parse().map_err(|_| "Invalid --workers")?,
        batch_size: flag("batch-size").unwrap_or_else(|| "50000".to_string()).parse().map_err(|_| "Invalid --batch-size")?,
        visitor_pool_size: flag("visitors").unwrap_or_else(|| "100000".to_string()).parse().map_err(|_| "Invalid --visitors")?,
        days: flag("days").unwrap_or_else(|| "365".to_string()).parse().map_err(|_| "Invalid --days")?,
        clickhouse_url: flag("url").unwrap_or(env_url),
        clickhouse_user: flag("user").unwrap_or(env_user),
        clickhouse_password: flag("password").unwrap_or(env_password),
    })
}

const PAGE_PATHS: &[&str] = &[
    "/", "/", "/", "/",
    "/pricing", "/pricing",
    "/features", "/about", "/blog", "/contact", "/login", "/signup",
    "/blog/getting-started", "/blog/privacy-first-analytics", "/blog/cookieless-tracking",
    "/docs", "/docs/installation", "/docs/api-reference", "/docs/self-hosting",
    "/changelog", "/terms", "/privacy",
    "/settings", "/settings/billing", "/settings/team",
    "/integrations", "/integrations/slack",
];

const BROWSERS: &[(&str, &str)] = &[
    ("Chrome", "120"), ("Chrome", "122"), ("Chrome", "124"), ("Chrome", "128"),
    ("Chrome", "130"), ("Chrome", "132"), ("Chrome", "134"), ("Chrome", "135"),
    ("Chrome", "136"), ("Chrome", "137"),
    ("Safari", "17"), ("Safari", "17"), ("Safari", "18"), ("Safari", "18"),
    ("Firefox", "128"), ("Firefox", "130"), ("Firefox", "133"),
    ("Edge", "122"), ("Edge", "130"),
    ("Samsung Internet", "24"),
    ("Opera", "108"),
];

const OS: &[(&str, &str, &str)] = &[
    ("Windows", "10", "desktop"), ("Windows", "10", "desktop"), ("Windows", "10", "desktop"),
    ("Windows", "11", "desktop"), ("Windows", "11", "desktop"), ("Windows", "11", "desktop"),
    ("macOS", "13", "desktop"), ("macOS", "14", "desktop"), ("macOS", "15", "desktop"),
    ("iOS", "16", "mobile"), ("iOS", "17", "mobile"), ("iOS", "18", "mobile"), ("iOS", "18", "mobile"),
    ("Android", "13", "mobile"), ("Android", "14", "mobile"), ("Android", "14", "mobile"),
    ("Android", "15", "mobile"), ("Android", "15", "mobile"),
    ("Linux", "Ubuntu 24.04", "desktop"),
    ("iPadOS", "17", "tablet"), ("iPadOS", "18", "tablet"),
];

const COUNTRIES: &[&str] = &[
    "US", "US", "US", "US", "US", "US",
    "GB", "GB",
    "DE", "DE",
    "FR",
    "CA",
    "AU",
    "IN",
    "NL",
    "SE",
    "BR",
    "NO", "DK", "CH", "AT", "BE", "FI", "IE", "ES", "IT", "PL",
    "CZ", "JP", "KR", "SG", "NZ", "ZA", "NG", "MX", "AR", "TR",
    "IL", "AE", "SA", "EG", "PH", "ID", "MY", "TH", "VN", "UA",
    "RU", "PT", "HU", "RO", "SK", "GR", "BG", "HR", "CO", "CL",
];

const REFERRER_SOURCES: &[&str] = &[
    "direct", "direct", "direct",
    "search", "search", "search",
    "social", "social",
    "email", "referral", "unknown",
];

const SEARCH_ENGINES: &[(&str, &str)] = &[
    ("Google", "https://www.google.com/search"),
    ("Google", "https://www.google.com/search"),
    ("Google", "https://www.google.com/search"),
    ("Bing", "https://www.bing.com/search"),
    ("DuckDuckGo", "https://duckduckgo.com/"),
    ("Yahoo", "https://search.yahoo.com/"),
    ("Yandex", "https://yandex.ru/search"),
];

const SEARCH_TERMS: &[&str] = &[
    "best pricing", "how to", "reviews", "alternatives", "tutorial",
    "free trial", "features", "comparison", "getting started", "documentation",
    "integration", "setup guide", "pricing plans", "",
];

const SOCIAL_NETWORKS: &[(&str, &str)] = &[
    ("Twitter", "https://twitter.com/"),
    ("Twitter", "https://twitter.com/"),
    ("Facebook", "https://www.facebook.com/"),
    ("LinkedIn", "https://www.linkedin.com/"),
    ("LinkedIn", "https://www.linkedin.com/"),
    ("Reddit", "https://www.reddit.com/"),
    ("HackerNews", "https://news.ycombinator.com/"),
    ("YouTube", "https://www.youtube.com/"),
    ("Instagram", "https://www.instagram.com/"),
];

const UTM_SOURCES: &[&str] = &["google", "facebook", "twitter", "linkedin", "newsletter", "bing", "instagram"];
const UTM_MEDIUMS: &[&str] = &["cpc", "social", "email", "organic", "referral", "display", "affiliate"];
const UTM_TERMS: &[&str] = &["analytics", "dashboard", "tracking", "marketing", "conversion", ""];
const UTM_CONTENTS: &[&str] = &["banner_a", "banner_b", "sidebar", "footer", "hero", ""];

const CUSTOM_EVENTS: &[(&str, &str)] = &[
    ("cart-checkout", r#"{"value":49.99,"currency":"USD"}"#),
    ("cart-checkout", r#"{"value":129.00,"currency":"USD"}"#),
    ("product-clicked", r#"{"product_id":"abc123","category":"software"}"#),
    ("product-clicked", r#"{"product_id":"xyz789","category":"enterprise"}"#),
    ("sign-up-started", r#"{"plan":"free"}"#),
    ("sign-up-started", r#"{"plan":"pro"}"#),
    ("demo-requested", r#"{"source":"pricing-page"}"#),
    ("feature-used", r#"{"feature":"export","format":"csv"}"#),
    ("upgrade-clicked", r#"{"from":"free","to":"pro"}"#),
];

const OUTBOUND_URLS: &[&str] = &[
    "https://github.com/betterlytics",
    "https://twitter.com/betterlytics",
    "https://docs.betterlytics.io",
    "https://stripe.com/checkout",
];

#[derive(Clone)]
struct Visitor {
    visitor_id: String,
    sessions: Vec<String>,
}

fn build_visitor_pool(size: usize) -> Vec<Visitor> {
    (0..size).map(|_| Visitor {
        visitor_id: Uuid::new_v4().to_string(),
        sessions: (0..rand::thread_rng().gen_range(1..=6usize)).map(|_| Uuid::new_v4().to_string()).collect(),
    }).collect()
}

fn generate_event(rng: &mut SmallRng, site_id: &str, domain: &str, visitors: &[Visitor], campaigns: &[String], start_ts: i64, range_secs: i64) -> EventRow {
    let visitor = visitors.choose(rng).unwrap();
    let session_id = visitor.sessions.choose(rng).unwrap().clone();
    let timestamp = Utc.timestamp_opt(start_ts + rng.gen_range(0..range_secs), 0).unwrap();
    let (os, os_version, device_type) = *OS.choose(rng).unwrap();
    let (browser, browser_version) = *BROWSERS.choose(rng).unwrap();

    let ref_source = *REFERRER_SOURCES.choose(rng).unwrap();
    let (ref_source_name, ref_search_term, ref_url) = match ref_source {
        "search" => {
            let (engine, url) = *SEARCH_ENGINES.choose(rng).unwrap();
            (engine, *SEARCH_TERMS.choose(rng).unwrap(), url)
        }
        "social" => {
            let (network, url) = *SOCIAL_NETWORKS.choose(rng).unwrap();
            (network, "", url)
        }
        "email" => ("Email", "", "https://mail.google.com/"),
        "referral" => ("Referral", "", "https://example.com/"),
        _ => ("", "", ""),
    };

    let (utm_source, utm_medium, utm_campaign, utm_term, utm_content) = if rng.gen_bool(0.30) {
        (
            *UTM_SOURCES.choose(rng).unwrap(),
            *UTM_MEDIUMS.choose(rng).unwrap(),
            campaigns.choose(rng).map(|s| s.as_str()).unwrap_or(""),
            *UTM_TERMS.choose(rng).unwrap(),
            *UTM_CONTENTS.choose(rng).unwrap(),
        )
    } else {
        ("", "", "", "", "")
    };

    let mut event_type = EventType::Pageview;
    let mut custom_event_name = "";
    let mut custom_event_json = "";
    let mut outbound_link_url = "";
    let mut cwv_cls: Option<f32> = None;
    let mut cwv_lcp: Option<f32> = None;
    let mut cwv_inp: Option<f32> = None;
    let mut cwv_fcp: Option<f32> = None;
    let mut cwv_ttfb: Option<f32> = None;
    let mut scroll_depth_percentage: Option<f32> = None;
    let mut scroll_depth_pixels: Option<f32> = None;

    let r: f64 = rng.gen();
    if r < 0.83 {
    } else if r < 0.91 {
        event_type = EventType::ScrollDepth;
        let pct = rng.gen_range(10..=100) as f32;
        scroll_depth_percentage = Some(pct);
        scroll_depth_pixels = Some(pct * rng.gen_range(8.0..20.0));
    } else if r < 0.97 {
        event_type = EventType::Cwv;
        cwv_cls = Some(rng.gen_range(0.0_f32..0.5));
        cwv_lcp = Some(rng.gen_range(800.0_f32..4000.0));
        cwv_inp = Some(rng.gen_range(50.0_f32..500.0));
        cwv_fcp = Some(rng.gen_range(500.0_f32..3000.0));
        cwv_ttfb = Some(rng.gen_range(100.0_f32..1500.0));
    } else if r < 0.99 {
        event_type = EventType::Custom;
        let (name, props) = CUSTOM_EVENTS.choose(rng).unwrap();
        custom_event_name = name;
        custom_event_json = props;
    } else {
        event_type = EventType::OutboundLink;
        outbound_link_url = OUTBOUND_URLS.choose(rng).unwrap();
    }

    EventRow {
        site_id: site_id.to_string(),
        visitor_id: visitor.visitor_id.clone(),
        session_id,
        domain: domain.to_string(),
        url: PAGE_PATHS.choose(rng).unwrap().to_string(),
        device_type: device_type.to_string(),
        country_code: COUNTRIES.choose(rng).map(|c| c.to_string()),
        date: timestamp.date_naive(),
        timestamp,
        browser: browser.to_string(),
        browser_version: browser_version.to_string(),
        os: os.to_string(),
        os_version: os_version.to_string(),
        referrer_source: ref_source.to_string(),
        referrer_source_name: ref_source_name.to_string(),
        referrer_search_term: ref_search_term.to_string(),
        referrer_url: ref_url.to_string(),
        utm_source: utm_source.to_string(),
        utm_medium: utm_medium.to_string(),
        utm_campaign: utm_campaign.to_string(),
        utm_term: utm_term.to_string(),
        utm_content: utm_content.to_string(),
        event_type,
        custom_event_name: custom_event_name.to_string(),
        custom_event_json: custom_event_json.to_string(),
        outbound_link_url: outbound_link_url.to_string(),
        cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
        scroll_depth_percentage, scroll_depth_pixels,
    }
}

async fn run_worker(
    worker_id: usize,
    rows_to_insert: u64,
    batch_size: usize,
    client: Client,
    site_id: String,
    domain: String,
    visitors: Arc<Vec<Visitor>>,
    campaigns: Arc<Vec<String>>,
    start_ts: i64,
    range_secs: i64,
    counter: Arc<AtomicU64>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut rng = SmallRng::seed_from_u64(worker_id as u64 * 0xdeadbeef);
    let mut inserted: u64 = 0;

    while inserted < rows_to_insert {
        let batch = (batch_size as u64).min(rows_to_insert - inserted) as usize;
        let mut insert = client.insert("analytics.events")?;
        for _ in 0..batch {
            insert.write(&generate_event(&mut rng, &site_id, &domain, &visitors, &campaigns, start_ts, range_secs)).await?;
        }
        insert.end().await?;
        inserted += batch as u64;
        counter.fetch_add(batch as u64, Ordering::Relaxed);
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    let config = match parse_args() {
        Ok(c) => c,
        Err(msg) => { eprintln!("{}", msg); std::process::exit(1); }
    };

    let visitors = Arc::new(build_visitor_pool(config.visitor_pool_size));
    let campaigns: Arc<Vec<String>> = Arc::new(
        (0..12).map(|_| Uuid::new_v4().to_string()[..8].to_string()).collect()
    );

    let now = Utc::now().timestamp();
    let start_ts = now - config.days * 86400;
    let range_secs = config.days * 86400;

    let client = Client::default()
        .with_url(&config.clickhouse_url)
        .with_user(&config.clickhouse_user)
        .with_password(&config.clickhouse_password)
        .with_database("analytics");

    println!("[+] Inserting {} rows for site '{}' | {} workers | batch {} | {} days",
        config.total_rows, config.site_id, config.workers, config.batch_size, config.days);

    let counter = Arc::new(AtomicU64::new(0));
    let start = Instant::now();

    let rows_per_worker = config.total_rows / config.workers as u64;
    let mut handles = Vec::new();
    for i in 0..config.workers {
        let extra = if i == 0 { config.total_rows % config.workers as u64 } else { 0 };
        handles.push(tokio::spawn(run_worker(
            i, rows_per_worker + extra, config.batch_size,
            client.clone(), config.site_id.clone(), config.domain.clone(),
            Arc::clone(&visitors), Arc::clone(&campaigns),
            start_ts, range_secs, Arc::clone(&counter),
        )));
    }

    let counter_clone = Arc::clone(&counter);
    let total = config.total_rows;
    let progress = tokio::spawn(async move {
        let mut last = 0u64;
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let done = counter_clone.load(Ordering::Relaxed);
            if done >= total { break; }
            let rps = (done - last) / 2;
            last = done;
            let eta = if rps > 0 { (total - done) / rps } else { 0 };
            eprint!("\r[+] {}/{} ({:.1}%) | {:>6} rows/s | ETA: {}s   ",
                done, total, done as f64 / total as f64 * 100.0, rps, eta);
        }
    });

    let mut had_error = false;
    for handle in handles {
        if let Err(e) = handle.await.unwrap() {
            eprintln!("\n[!] Worker error: {}", e);
            had_error = true;
        }
    }
    progress.abort();

    let done = counter.load(Ordering::Relaxed);
    println!("\r[+] Done! {} rows in {:.1}s ({:.0} rows/s){}",
        done, start.elapsed().as_secs_f64(), done as f64 / start.elapsed().as_secs_f64(),
        if had_error { " (with errors)" } else { "" });
}
