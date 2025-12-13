use crate::config::Config;
use anyhow::{Context, Result};
use bytes::Bytes;
use flate2::read::GzDecoder;
use httpdate::parse_http_date;
use maxminddb::Reader;
use reqwest::{Client, header};
use std::fs;
use std::io::{Cursor, Read};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tar::Archive;
use tokio::sync::watch;
use tokio::time::interval;
use tracing::{debug, error, info, warn};

const GEOIP_DATABASE_URL: &str =
    "https://download.maxmind.com/geoip/databases/GeoLite2-Country/download?suffix=tar.gz";

/// Notifies watchers when the GeoIP database is updated.
pub type GeoIpWatchRx = watch::Receiver<Option<Arc<Reader<Vec<u8>>>>>;
/// Sends notifications when the GeoIP database is updated.
pub type GeoIpWatchTx = watch::Sender<Option<Arc<Reader<Vec<u8>>>>>;

pub struct GeoIpUpdater {
    config: Arc<Config>,
    client: Client,
    db_path: PathBuf,
    update_interval: Duration,
    watch_tx: GeoIpWatchTx,
}

impl GeoIpUpdater {
    /// Creates a new updater and returns it along with a watch receiver.
    pub fn new(config: Arc<Config>) -> Result<(Self, GeoIpWatchRx)> {
        let (watch_tx, watch_rx) = watch::channel(None);

        let updater = Self {
            client: Client::builder()
                .user_agent("betterlytics-updater/0.1")
                .build()?,
            db_path: config.geoip_db_path.clone(),
            update_interval: config.geoip_update_interval,
            config,
            watch_tx,
        };
        Ok((updater, watch_rx))
    }

    /// Starts the background update check loop.
    pub async fn run(self: Arc<Self>) {
        if !self.config.enable_geolocation
            || self.config.maxmind_account_id.is_none()
            || self.config.maxmind_license_key.is_none()
        {
            info!(
                "GeoIP database auto-update disabled (geolocation disabled or credentials missing)."
            );
            return;
        }

        info!(
            "Starting GeoIP database update loop every {:?}",
            self.update_interval
        );
        let mut interval = interval(self.update_interval);

        interval.tick().await;
        self.check_and_update().await;

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

        debug!("Sending HEAD request to {}", GEOIP_DATABASE_URL);
        let response = self
            .client
            .head(GEOIP_DATABASE_URL)
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
                let local_time = metadata
                    .modified()
                    .context("Failed to get local file modification time")?;
                debug!("Local database modified: {:?}", local_time);
                Ok(remote_time > local_time)
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                info!(
                    "Local database file not found at {:?}. Update needed.",
                    self.db_path
                );
                Ok(true)
            }
            Err(e) => Err(e).context("Failed to get local file metadata"),
        }
    }

    /// Downloads, decompresses, extracts, and replaces the database file.
    async fn download_and_replace(&self) -> Result<Reader<Vec<u8>>> {
        let compressed_data = self
            .download_archive()
            .await
            .context("Failed during database archive download")?;

        let decompressed_data = self
            .extract_mmdb_from_archive(&compressed_data)
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

        debug!("Downloading database archive from {}", GEOIP_DATABASE_URL);
        let response = self
            .client
            .get(GEOIP_DATABASE_URL)
            .basic_auth(account_id, Some(license_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "<failed to read body>".to_string());
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

        let data =
            mmdb_data.context("Could not find .mmdb file within the downloaded tar archive")?;
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
