use crate::config::Config;
use crate::geoip_updater::GeoIpWatchRx;
use crate::ip_parser::anonymize_ip;
use anyhow::Result;
use maxminddb::{geoip2, Reader};
use moka::sync::Cache;
use std::net::IpAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tracing::{debug, error, info, warn};

const CACHE_TTI: Duration = Duration::from_secs(1200);
const CACHE_SIZE: u64 = 100_000;
const READER_UPDATE_CHECK_INTERVAL: Duration = Duration::from_secs(1200);

#[derive(Clone, Debug, Default)]
pub struct AsnInfo {
    pub asn: u32,
    pub org: String,
}

#[derive(Clone)]
pub struct AsnService {
    watch_rx: Arc<Mutex<GeoIpWatchRx>>,
    current_reader: Arc<RwLock<Option<Arc<Reader<Vec<u8>>>>>>,
    cache: Cache<String, AsnInfo>,
    last_reader_check: Arc<AtomicU64>,
}

impl AsnService {
    pub fn new(config: Arc<Config>, watch_rx: GeoIpWatchRx) -> Result<Self> {
        let mut initial_reader = None;
        let db_path = &config.asn_db_path;
        if db_path.exists() {
            match Reader::open_readfile(db_path) {
                Ok(reader) => {
                    info!("Initial ASN database loaded from: {:?}", db_path);
                    initial_reader = Some(Arc::new(reader));
                }
                Err(e) => {
                    error!("Failed to load initial ASN database from {:?}: {}. ASN lookups delayed until first update.", db_path, e);
                }
            }
        } else {
            info!("ASN database not found at {:?}. ASN lookups disabled until first update.", db_path);
        }

        let rx_mutex = Arc::new(Mutex::new(watch_rx));
        let reader_from_watch = rx_mutex.lock().unwrap().borrow().clone();
        let reader_to_use = reader_from_watch.or(initial_reader);

        let cache = Cache::builder()
            .max_capacity(CACHE_SIZE)
            .time_to_idle(CACHE_TTI)
            .build();

        let now_secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Ok(Self {
            watch_rx: rx_mutex,
            current_reader: Arc::new(RwLock::new(reader_to_use)),
            cache,
            last_reader_check: Arc::new(AtomicU64::new(now_secs)),
        })
    }

    fn update_reader_if_changed(&self) {
        let now_secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let last_check_secs = self.last_reader_check.load(Ordering::Relaxed);
        if now_secs.saturating_sub(last_check_secs) < READER_UPDATE_CHECK_INTERVAL.as_secs() {
            return;
        }
        if self.last_reader_check
            .compare_exchange_weak(last_check_secs, now_secs, Ordering::Relaxed, Ordering::Relaxed)
            .is_err()
        {
            return;
        }

        let mut rx_guard = match self.watch_rx.try_lock() {
            Ok(guard) => guard,
            Err(_) => {
                self.last_reader_check.store(last_check_secs, Ordering::Relaxed);
                return;
            }
        };

        if rx_guard.has_changed().unwrap_or(false) {
            let latest_reader = rx_guard.borrow_and_update().clone();
            drop(rx_guard);

            *self.current_reader.write().unwrap() = latest_reader;
            self.cache.invalidate_all();
            info!("ASN cache cleared due to database update");
        }
    }

    /// Returns `AsnInfo::default()` (asn 0, empty org) when the database is
    /// unavailable or the IP is unknown — ASN is a best-effort fact.
    pub fn lookup(&self, ip_address: &str) -> AsnInfo {
        if ip_address == "127.0.0.1" || ip_address == "::1" {
            return AsnInfo::default();
        }

        let anonymized = anonymize_ip(ip_address).unwrap_or_else(|| ip_address.to_string());

        if let Some(cached) = self.cache.get(&anonymized) {
            return cached;
        }

        self.update_reader_if_changed();

        let reader = match self.current_reader.read().unwrap().clone() {
            Some(reader) => reader,
            None => {
                let result = AsnInfo::default();
                self.cache.insert(anonymized, result.clone());
                return result;
            }
        };

        let ip: IpAddr = match anonymized.parse() {
            Ok(ip) => ip,
            Err(e) => {
                warn!("Failed to parse IP address for ASN lookup: {}", e);
                return AsnInfo::default();
            }
        };

        let result = match reader.lookup::<geoip2::Asn>(ip) {
            Ok(Some(record)) => AsnInfo {
                asn: record.autonomous_system_number.unwrap_or(0),
                org: record
                    .autonomous_system_organization
                    .map(str::to_string)
                    .unwrap_or_default(),
            },
            Ok(None) => AsnInfo::default(),
            Err(e) => {
                debug!("ASN lookup failed: {}", e);
                AsnInfo::default()
            }
        };

        self.cache.insert(anonymized, result.clone());
        result
    }
}
