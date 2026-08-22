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
    /// `initial_reader: None` means no database was available at boot; the source
    /// then only serves a reader once the watch channel publishes one
    pub fn new(initial_reader: Option<Arc<Reader<Vec<u8>>>>, watch_rx: GeoIpWatchRx, check_interval: Duration) -> Self {
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
        if self.reader().is_some() {
            if now_secs.saturating_sub(last_check_secs) < self.check_interval.as_secs() {
                return false;
            }
            if self.last_check
                .compare_exchange_weak(last_check_secs, now_secs, Ordering::Relaxed, Ordering::Relaxed)
                .is_err()
            {
                return false;
            }
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
    credentials: Option<(String, String)>,
    client: Client,
    label: &'static str,
    db_path: PathBuf,
    database_url: &'static str,
    update_interval: Duration,
    watch_tx: GeoIpWatchTx,
    feature_enabled: bool,
}

impl GeoIpUpdater {
    /// Creates a new updater and returns it along with a watch receiver.
    pub fn new(config: Arc<Config>) -> Result<(Self, GeoIpWatchRx)> {
        let database_url = if config.geolocation_mode.has_subdivisions() {
            GEOIP_CITY_DATABASE_URL
        } else {
            GEOIP_COUNTRY_DATABASE_URL
        };

        let feature_enabled = config.geolocation_mode.is_enabled();
        let db_path = config.geoip_db_path.clone();
        Self::with_database(&config, "GeoIP", database_url, db_path, feature_enabled)
    }

    /// Creates an updater for the ASN database. Independent of geolocation mode:
    /// ASN data drives bot detection, not geo reports.
    pub fn new_asn(config: Arc<Config>) -> Result<(Self, GeoIpWatchRx)> {
        let db_path = config.asn_db_path.clone();
        let feature_enabled = config.enable_asn_lookup;
        Self::with_database(&config, "ASN", GEOIP_ASN_DATABASE_URL, db_path, feature_enabled)
    }

    fn with_database(
        config: &Config,
        label: &'static str,
        database_url: &'static str,
        db_path: PathBuf,
        feature_enabled: bool,
    ) -> Result<(Self, GeoIpWatchRx)> {
        let (watch_tx, watch_rx) = watch::channel(None);

        let updater = Self {
            client: Client::builder().user_agent("betterlytics-updater/0.1").build()?,
            label,
            db_path,
            database_url,
            update_interval: config.geoip_update_interval,
            credentials: config.maxmind_account_id.clone().zip(config.maxmind_license_key.clone()),
            watch_tx,
            feature_enabled,
        };
        Ok((updater, watch_rx))
    }

    /// Obtains the database before the server binds: the local file when present,
    /// otherwise a fresh download. `Ok(None)` only when the feature is disabled.
    pub async fn bootstrap(&self) -> Result<Option<Arc<Reader<Vec<u8>>>>> {
        if !self.feature_enabled {
            return Ok(None);
        }

        match Reader::open_readfile(&self.db_path) {
            Ok(reader) => {
                info!("{} database loaded from {:?}", self.label, self.db_path);
                return Ok(Some(Arc::new(reader)));
            }
            Err(maxminddb::MaxMindDbError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => {
                info!("{} database not found at {:?}, downloading", self.label, self.db_path);
            }
            Err(e) => {
                warn!("{} database at {:?} is unreadable ({}), downloading a fresh copy", self.label, self.db_path, e);
            }
        }

        if self.credentials.is_none() {
            anyhow::bail!(
                "{} database not found at {:?} and MAXMIND_ACCOUNT_ID/MAXMIND_LICENSE_KEY are not set; \
                 provide the file or the credentials, or disable the feature",
                self.label, self.db_path
            );
        }

        let reader = self
            .download_and_replace()
            .await
            .with_context(|| format!("{} database download failed", self.label))?;
        Ok(Some(Arc::new(reader)))
    }

    /// Starts the background update check loop.
    pub async fn run(self: Arc<Self>) {
        if !self.feature_enabled || self.credentials.is_none() {
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
        let (account_id, license_key) = self.credentials.as_ref().unwrap();

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
        let (account_id, license_key) = self.credentials.as_ref().unwrap();

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

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use std::io::Write;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    pub(crate) fn minimal_mmdb() -> Vec<u8> {
        let mut db = Vec::new();
        db.extend_from_slice(&[0, 0, 1, 0, 0, 1]);
        db.extend_from_slice(&[0u8; 16]);
        db.extend_from_slice(b"\xab\xcd\xefMaxMind.com");
        let key = |db: &mut Vec<u8>, k: &str| {
            db.push(0x40 | k.len() as u8);
            db.extend_from_slice(k.as_bytes());
        };
        db.push(0xE9);
        key(&mut db, "binary_format_major_version"); db.extend_from_slice(&[0xA1, 2]);
        key(&mut db, "binary_format_minor_version"); db.extend_from_slice(&[0xA0]);
        key(&mut db, "build_epoch"); db.extend_from_slice(&[0x00, 0x02]);
        key(&mut db, "database_type"); db.extend_from_slice(b"\x44Test");
        key(&mut db, "description"); db.push(0xE0);
        key(&mut db, "ip_version"); db.extend_from_slice(&[0xA1, 6]);
        key(&mut db, "languages"); db.extend_from_slice(&[0x00, 0x04]);
        key(&mut db, "node_count"); db.extend_from_slice(&[0xC1, 1]);
        key(&mut db, "record_size"); db.extend_from_slice(&[0xA1, 24]);
        db
    }

    fn mmdb_tar_gz() -> Vec<u8> {
        let mmdb = minimal_mmdb();
        let mut header = tar::Header::new_gnu();
        header.set_size(mmdb.len() as u64);
        header.set_mode(0o644);
        header.set_cksum();
        let mut tar = tar::Builder::new(Vec::new());
        tar.append_data(&mut header, "GeoLite2-Test_20260101/GeoLite2-Test.mmdb", mmdb.as_slice()).unwrap();
        let tar = tar.into_inner().unwrap();
        let mut gz = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::fast());
        gz.write_all(&tar).unwrap();
        gz.finish().unwrap()
    }

    /// Answers exactly one HTTP request with the given status and body.
    async fn serve_once(status: &'static str, body: Vec<u8>) -> &'static str {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}/download", listener.local_addr().unwrap());
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buf = [0u8; 4096];
            let _ = socket.read(&mut buf).await;
            let head = format!(
                "HTTP/1.1 {status}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                body.len()
            );
            socket.write_all(head.as_bytes()).await.unwrap();
            socket.write_all(&body).await.unwrap();
            socket.shutdown().await.unwrap();
        });
        Box::leak(url.into_boxed_str())
    }

    fn temp_db_path(name: &str) -> PathBuf {
        std::env::temp_dir()
            .join(format!("betterlytics-geoip-test-{}-{}", std::process::id(), name))
            .join("db.mmdb")
    }

    fn updater(
        db_path: PathBuf,
        database_url: &'static str,
        credentials: Option<(String, String)>,
        feature_enabled: bool,
    ) -> (GeoIpUpdater, GeoIpWatchRx) {
        let (watch_tx, watch_rx) = watch::channel(None);
        let updater = GeoIpUpdater {
            credentials,
            client: Client::new(),
            label: "Test",
            db_path,
            database_url,
            update_interval: Duration::from_secs(3600),
            watch_tx,
            feature_enabled,
        };
        (updater, watch_rx)
    }

    fn creds() -> Option<(String, String)> {
        Some(("id".to_string(), "key".to_string()))
    }

    #[test]
    fn minimal_mmdb_is_a_valid_database() {
        let reader = Reader::from_source(minimal_mmdb()).unwrap();
        let found = reader.lookup::<maxminddb::geoip2::Country>("8.8.8.8".parse().unwrap()).unwrap();
        assert!(found.is_none());
    }

    #[tokio::test]
    async fn bootstrap_returns_none_when_feature_disabled() {
        let (updater, _rx) = updater(temp_db_path("disabled"), "http://127.0.0.1:9/", None, false);
        assert!(updater.bootstrap().await.unwrap().is_none());
    }

    #[tokio::test]
    async fn bootstrap_loads_local_file_without_network() {
        let path = temp_db_path("local");
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, minimal_mmdb()).unwrap();
        let (updater, _rx) = updater(path, "http://127.0.0.1:9/", None, true);
        assert!(updater.bootstrap().await.unwrap().is_some());
    }

    #[tokio::test]
    async fn bootstrap_fails_without_file_or_credentials() {
        let (updater, _rx) = updater(temp_db_path("nocreds"), "http://127.0.0.1:9/", None, true);
        let err = updater.bootstrap().await.unwrap_err().to_string();
        assert!(err.contains("MAXMIND_ACCOUNT_ID"), "{err}");
    }

    #[tokio::test]
    async fn bootstrap_downloads_when_file_missing() {
        let path = temp_db_path("download");
        let _ = fs::remove_dir_all(path.parent().unwrap());
        let url = serve_once("200 OK", mmdb_tar_gz()).await;
        let (updater, _rx) = updater(path.clone(), url, creds(), true);
        assert!(updater.bootstrap().await.unwrap().is_some());
        assert_eq!(fs::read(&path).unwrap(), minimal_mmdb());
    }

    #[tokio::test]
    async fn bootstrap_fails_when_download_rejected() {
        let path = temp_db_path("rejected");
        let _ = fs::remove_dir_all(path.parent().unwrap());
        let url = serve_once("401 Unauthorized", b"bad credentials".to_vec()).await;
        let (updater, _rx) = updater(path.clone(), url, creds(), true);
        let err = format!("{:#}", updater.bootstrap().await.unwrap_err());
        assert!(err.contains("401"), "{err}");
        assert!(!path.exists());
    }

    #[tokio::test]
    async fn bootstrap_fails_when_server_unreachable() {
        let path = temp_db_path("unreachable");
        let _ = fs::remove_dir_all(path.parent().unwrap());
        let (updater, _rx) = updater(path, "http://127.0.0.1:9/download", creds(), true);
        assert!(updater.bootstrap().await.is_err());
    }

    #[tokio::test]
    async fn bootstrap_replaces_corrupt_local_file() {
        let path = temp_db_path("corrupt");
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, b"not an mmdb").unwrap();
        let url = serve_once("200 OK", mmdb_tar_gz()).await;
        let (updater, _rx) = updater(path.clone(), url, creds(), true);
        assert!(updater.bootstrap().await.unwrap().is_some());
        assert_eq!(fs::read(&path).unwrap(), minimal_mmdb());
    }

    #[test]
    fn source_without_reader_adopts_published_database_immediately() {
        let (tx, rx) = watch::channel(None);
        let source = MmdbSource::new(None, rx, Duration::from_secs(3600));
        assert!(!source.refresh_if_due());
        assert!(source.reader().is_none());

        tx.send(Some(Arc::new(Reader::from_source(minimal_mmdb()).unwrap()))).unwrap();
        assert!(source.refresh_if_due());
        assert!(source.reader().is_some());
    }

    #[test]
    fn source_with_reader_waits_for_check_interval() {
        let initial = Arc::new(Reader::from_source(minimal_mmdb()).unwrap());
        let (tx, rx) = watch::channel(None);
        let source = MmdbSource::new(Some(initial), rx, Duration::from_secs(3600));

        tx.send(Some(Arc::new(Reader::from_source(minimal_mmdb()).unwrap()))).unwrap();
        assert!(!source.refresh_if_due());
    }
}
