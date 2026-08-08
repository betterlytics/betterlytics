use crate::config::Config;
use maxminddb::Reader;
use std::fs;
use std::io::{Cursor, Read};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::watch;
use tokio::time::interval;
use tracing::{info, warn, error, debug};
use anyhow::{Result, Context};
use reqwest::{Client, header};
use flate2::read::GzDecoder;
use tar::Archive;
use httpdate::parse_http_date;
use bytes::Bytes;

const GEOIP_CITY_DATABASE_URL: &str = "https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz";
const GEOIP_COUNTRY_DATABASE_URL: &str = "https://download.maxmind.com/geoip/databases/GeoLite2-Country/download?suffix=tar.gz";
const GEOIP_ASN_DATABASE_URL: &str = "https://download.maxmind.com/geoip/databases/GeoLite2-ASN/download?suffix=tar.gz";

/// Notifies watchers when the GeoIP database is updated.
pub type GeoIpWatchRx = watch::Receiver<Option<Arc<Reader<Vec<u8>>>>>;

/// Holds a service's current MMDB reader, refreshed from the updater's watch
/// channel at most once per `check_interval`.
#[derive(Clone)]
pub struct MmdbSource {
    watch_rx: Arc<std::sync::Mutex<GeoIpWatchRx>>,
    current_reader: Arc<std::sync::RwLock<Option<Arc<Reader<Vec<u8>>>>>>,
    last_check: Arc<std::sync::atomic::AtomicU64>,
    check_interval: Duration,
}

impl MmdbSource {
    /// `db_path: None` skips the initial load (feature disabled); the source then
    /// only ever serves a reader if the watch channel publishes one
    pub fn new(db_path: Option<&std::path::Path>, label: &str, watch_rx: GeoIpWatchRx, check_interval: Duration) -> Self {
        let mut initial_reader = None;
        if let Some(db_path) = db_path {
            if db_path.exists() {
                match Reader::open_readfile(db_path) {
                    Ok(reader) => {
                        info!("Initial {} database loaded from: {:?}", label, db_path);
                        initial_reader = Some(Arc::new(reader));
                    }
                    Err(e) => {
                        error!("Failed to load initial {} database from {:?}: {}. Lookups delayed until first update.", label, db_path, e);
                    }
                }
            } else {
                warn!("{} database not found at {:?}. Lookups disabled until first update.", label, db_path);
            }
        }

        let rx_mutex = Arc::new(std::sync::Mutex::new(watch_rx));
        let reader_to_use = rx_mutex.lock().unwrap().borrow().clone().or(initial_reader);
        let now_secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            watch_rx: rx_mutex,
            current_reader: Arc::new(std::sync::RwLock::new(reader_to_use)),
            last_check: Arc::new(std::sync::atomic::AtomicU64::new(now_secs)),
            check_interval,
        }
    }

    pub fn reader(&self) -> Option<Arc<Reader<Vec<u8>>>> {
        self.current_reader.read().unwrap().clone()
    }

    /// Swaps in a newly downloaded database when one is available; returns true so
    /// the caller can invalidate its lookup cache. At most one thread per interval
    /// pays for the check, claimed via CAS on the timestamp.
    pub fn refresh_if_due(&self) -> bool {
        use std::sync::atomic::Ordering;

        let now_secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let last_check_secs = self.last_check.load(Ordering::Relaxed);
        if now_secs.saturating_sub(last_check_secs) < self.check_interval.as_secs() {
            return false;
        }
        if self.last_check
            .compare_exchange_weak(last_check_secs, now_secs, Ordering::Relaxed, Ordering::Relaxed)
            .is_err()
        {
            return false;
        }

        let mut rx_guard = match self.watch_rx.try_lock() {
            Ok(guard) => guard,
            Err(_) => {
                self.last_check.store(last_check_secs, Ordering::Relaxed);
                return false;
            }
        };

        if !rx_guard.has_changed().unwrap_or(false) {
            return false;
        }
        let latest_reader = rx_guard.borrow_and_update().clone();
        // Release the watch lock before taking the write lock to avoid holding both
        drop(rx_guard);

        *self.current_reader.write().unwrap() = latest_reader;
        true
    }
}

/// Sends notifications when the GeoIP database is updated.
pub type GeoIpWatchTx = watch::Sender<Option<Arc<Reader<Vec<u8>>>>>;

pub struct GeoIpUpdater {
    config: Arc<Config>,
    client: Client,
    db_path: PathBuf,
    database_url: &'static str,
    update_interval: Duration,
    watch_tx: GeoIpWatchTx,
    enabled: bool,
}

impl GeoIpUpdater {
    /// Creates a new updater and returns it along with a watch receiver.
    pub fn new(config: Arc<Config>) -> Result<(Self, GeoIpWatchRx)> {
        let database_url = if config.geolocation_mode.has_subdivisions() {
            GEOIP_CITY_DATABASE_URL
        } else {
            GEOIP_COUNTRY_DATABASE_URL
        };

        let enabled = config.geolocation_mode.is_enabled() && Self::has_credentials(&config);
        let db_path = config.geoip_db_path.clone();
        Self::with_database(config, database_url, db_path, enabled)
    }

    /// Creates an updater for the ASN database. Independent of geolocation mode:
    /// ASN data drives bot detection, not geo reports.
    pub fn new_asn(config: Arc<Config>) -> Result<(Self, GeoIpWatchRx)> {
        let enabled = Self::has_credentials(&config);
        let db_path = config.asn_db_path.clone();
        Self::with_database(config, GEOIP_ASN_DATABASE_URL, db_path, enabled)
    }

    fn has_credentials(config: &Config) -> bool {
        config.maxmind_account_id.is_some() && config.maxmind_license_key.is_some()
    }

    fn with_database(
        config: Arc<Config>,
        database_url: &'static str,
        db_path: PathBuf,
        enabled: bool,
    ) -> Result<(Self, GeoIpWatchRx)> {
        let (watch_tx, watch_rx) = watch::channel(None);

        let updater = Self {
            client: Client::builder().user_agent("betterlytics-updater/0.1").build()?,
            db_path,
            database_url,
            update_interval: config.geoip_update_interval,
            config,
            watch_tx,
            enabled,
        };
        Ok((updater, watch_rx))
    }

    /// Starts the background update check loop.
    pub async fn run(self: Arc<Self>) {
        if !self.enabled {
            info!("Auto-update disabled for {} (feature disabled or credentials missing).", self.database_url);
            return;
        }

        info!("Starting GeoIP database update loop every {:?}", self.update_interval);
        let mut interval = interval(self.update_interval);

        // The first tick resolves immediately, so the initial check runs at startup
        loop {
            interval.tick().await;
            self.check_and_update().await;
        }
    }

    /// Checks if an update is needed via HEAD request and then downloads if necessary.
    async fn check_and_update(&self) {
        info!("Checking for GeoIP database updates...");
        match self.is_update_needed().await {
            Ok(true) => {
                info!("Remote GeoIP database is newer or local file missing. Downloading...");

                match self.download_and_replace().await {
                    Ok(new_reader) => {
                        info!("GeoIP database updated successfully.");
                        if self.watch_tx.send(Some(Arc::new(new_reader))).is_err() {
                            warn!("GeoIP watch channel closed, receiver likely dropped.");
                        }
                    }
                    Err(e) => {
                        error!("Failed to download and replace GeoIP database: {}", e);
                    }
                }
            }
            Ok(false) => {
                debug!("Local GeoIP database is up-to-date.");
            }
            Err(e) => {
                error!("Failed to check for GeoIP database update: {}", e);
            }
        }
    }

    /// Checks remote Last-Modified header against local file modified time.
    async fn is_update_needed(&self) -> Result<bool> {
        let account_id = self.config.maxmind_account_id.as_ref().unwrap();
        let license_key = self.config.maxmind_license_key.as_ref().unwrap();

        debug!("Sending HEAD request to {}", self.database_url);
        let response = self.client
            .head(self.database_url)
            .basic_auth(account_id, Some(license_key))
            .send()
            .await?;

        if !response.status().is_success() {
            anyhow::bail!("HEAD request failed: {}", response.status());
        }

        let remote_last_modified_str = response
            .headers()
            .get(header::LAST_MODIFIED)
            .context("No Last-Modified header found in HEAD response")?
            .to_str()
            .context("Last-Modified header is not valid UTF-8")?;
            
        let remote_time = parse_http_date(remote_last_modified_str)
            .context("Failed to parse Last-Modified header date")?;
        debug!("Remote database Last-Modified: {:?}", remote_time);

        match fs::metadata(&self.db_path) {
            Ok(metadata) => {
                let local_time = metadata.modified().context("Failed to get local file modification time")?;
                debug!("Local database modified: {:?}", local_time);
                Ok(remote_time > local_time)
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                info!("Local database file not found at {:?}. Update needed.", self.db_path);
                Ok(true)
            }
            Err(e) => {
                Err(e).context("Failed to get local file metadata")
            }
        }
    }

    /// Downloads, decompresses, extracts, and replaces the database file.
    async fn download_and_replace(&self) -> Result<Reader<Vec<u8>>> {
        let compressed_data = self.download_archive().await
            .context("Failed during database archive download")?;

        let decompressed_data = self.extract_mmdb_from_archive(&compressed_data)
            .context("Failed to extract mmdb data from archive")?;

        let new_reader = Reader::from_source(decompressed_data.clone())
            .context("Failed to load extracted mmdb data into reader")?;
        debug!("Successfully validated downloaded database content.");

        self.replace_database_file(&decompressed_data)
            .context("Failed to replace database file")?;

        Ok(new_reader)
    }

    /// Performs the actual download GET request.
    async fn download_archive(&self) -> Result<Bytes> {
        let account_id = self.config.maxmind_account_id.as_ref().unwrap();
        let license_key = self.config.maxmind_license_key.as_ref().unwrap();

        debug!("Downloading database archive from {}", self.database_url);
        let response = self.client
            .get(self.database_url)
            .basic_auth(account_id, Some(license_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_else(|_| "<failed to read body>".to_string());
            anyhow::bail!("Download request failed: {} - {}", status, body);
        }

        let content = response.bytes().await?;
        debug!("Downloaded {} compressed bytes.", content.len());
        Ok(content)
    }

    /// Helper: Decompresses gzip and extracts .mmdb data from tar archive bytes.
    fn extract_mmdb_from_archive(&self, compressed_data: &Bytes) -> Result<Vec<u8>> {
        debug!("Decompressing gzip layer...");
        let tar_data = GzDecoder::new(Cursor::new(compressed_data));
        
        debug!("Processing tar archive...");
        let mut archive = Archive::new(tar_data);
        let mut mmdb_data: Option<Vec<u8>> = None;

        for entry_result in archive.entries()? {
            let mut entry = entry_result?;
            let path = entry.path()?.into_owned();

            if path.extension().map_or(false, |ext| ext == "mmdb") {
                debug!("Found .mmdb file in archive: {:?}", path);
                let mut buffer = Vec::with_capacity(entry.size() as usize);
                entry.read_to_end(&mut buffer)?;
                mmdb_data = Some(buffer);
                break;
            }
        }

        let data = mmdb_data.context("Could not find .mmdb file within the downloaded tar archive")?;
        debug!("Extracted {} bytes of mmdb data.", data.len());
        Ok(data)
    }

    /// Writes data to a temp file and atomically renames it.
    fn replace_database_file(&self, data: &[u8]) -> Result<()> {
        let temp_path = self.db_path.with_extension("mmdb.tmp");
        debug!("Writing new database to temp file: {:?}", temp_path);
        
        // Ensure parent directory exists
        if let Some(parent) = self.db_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&temp_path, data)?;
        
        debug!("Atomically renaming temp file to: {:?}", self.db_path);
        fs::rename(&temp_path, &self.db_path)?;
        
        info!("Replaced database file at {:?}", self.db_path);
        Ok(())
    }
} 