use maxminddb::{geoip2, Reader};
use std::net::IpAddr;
use std::sync::{Arc, Mutex, RwLock};
use std::sync::atomic::{AtomicU64, Ordering};
use tracing::{info, warn, error, debug};
use crate::config::Config;
use crate::geoip_updater::GeoIpWatchRx;
use anyhow::Result;
use moka::sync::Cache;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const CACHE_TTI: Duration = Duration::from_secs(1200);
const CACHE_SIZE: u64 = 100000; // Cache up to 100k IP addresses
const READER_UPDATE_CHECK_INTERVAL: Duration = Duration::from_secs(1200); // Check for reader updates every 20 minutes

#[derive(Clone)]
pub struct GeoIpService {
    config: Arc<Config>,
    geoip_watch_rx: Arc<Mutex<GeoIpWatchRx>>,
    current_reader: Arc<RwLock<Option<Arc<Reader<Vec<u8>>>>>>,
    ip_cache: Cache<String, Option<String>>,
    last_reader_check: Arc<AtomicU64>,
}


impl GeoIpService {
    pub fn new(config: Arc<Config>, geoip_watch_rx: GeoIpWatchRx) -> Result<Self> {
        let mut initial_reader = None;
        if config.enable_geolocation {
            let db_path = &config.geoip_db_path;
            if db_path.exists() {
                info!("Loading initial GeoIP database from: {:?}", db_path);
                match Reader::open_readfile(db_path) {
                    Ok(reader) => {
                        info!("Initial GeoIP database loaded successfully.");
                        initial_reader = Some(Arc::new(reader));
                    }
                    Err(e) => {
                        error!("Failed to load initial GeoIP database from {:?}: {}. Geolocation may be delayed until first update.", db_path, e);
                    }
                }
            } else {
                warn!("Initial GeoIP database file not found at {:?}. Geolocation will be disabled until first update.", db_path);
            }
        } else {
            info!("Geolocation is disabled via config.");
        }

        let rx_mutex = Arc::new(Mutex::new(geoip_watch_rx));

        let current_reader_state = rx_mutex.lock().unwrap().borrow().clone();

        let reader_to_use = current_reader_state.or(initial_reader);

        // LRU cache with session-aligned TTI
        let cache = Cache::builder()
            .max_capacity(CACHE_SIZE)
            .time_to_idle(CACHE_TTI)
            .build();

        let now_secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Ok(Self {
            geoip_watch_rx: rx_mutex,
            current_reader: Arc::new(RwLock::new(reader_to_use)),
            ip_cache: cache,
            last_reader_check: Arc::new(AtomicU64::new(now_secs)),
            config: config.clone(), 
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

        // Try to atomically update the timestamp to claim the right to check
        // If another thread beats us to it, we can just return
        if self.last_reader_check
            .compare_exchange_weak(last_check_secs, now_secs, Ordering::Relaxed, Ordering::Relaxed)
            .is_err()
        {
            return;
        }

        // We successfully claimed the right to check for update
        let mut rx_guard = match self.geoip_watch_rx.try_lock() {
            Ok(guard) => guard,
            Err(_) => {
                self.last_reader_check.store(last_check_secs, Ordering::Relaxed);
                return;
            }
        };

        if rx_guard.has_changed().unwrap_or(false) {
            let latest_reader_option = rx_guard.borrow_and_update().clone();
            debug!("GeoIpService detected database update via watch channel.");
            
            // Drop the rx_guard before acquiring the write lock to avoid holding multiple locks
            drop(rx_guard);
            
            let mut current_reader_guard = self.current_reader.write().unwrap();
            *current_reader_guard = latest_reader_option;
            drop(current_reader_guard);
            
            self.ip_cache.invalidate_all();
            info!("GeoIP cache cleared due to database update");
        }
    }

    pub fn lookup_country_code(&self, ip_address: &str) -> Option<String> {
        if !self.config.enable_geolocation && (ip_address == "127.0.0.1" || ip_address == "::1") {
            debug!("LocalHost hit for IP: {}", ip_address);
            return Some("Localhost".to_string());
        }

        if let Some(cached_result) = self.ip_cache.get(ip_address) {
            debug!("GeoIP cache hit for IP: {}", ip_address);
            return cached_result;
        }

        debug!("GeoIP cache miss for IP: {}", ip_address);

        self.update_reader_if_changed();

        let reader_arc_option = self.current_reader.read().unwrap().clone();
        let reader = reader_arc_option?;

        let ip: IpAddr = match ip_address.parse() {
            Ok(ip) => ip,
            Err(e) => {
                warn!("Failed to parse IP address '{}': {}", ip_address, e);
                self.ip_cache.insert(ip_address.to_string(), None);
                return None;
            }
        };

        let result = match reader.lookup::<geoip2::Country>(ip) {
            Ok(lookup_result) => lookup_result
                .and_then(|geoip_data| geoip_data.country)
                .and_then(|country_data| country_data.iso_code)
                .map(|s| s.to_string()),
            Err(e) => {
                warn!("GeoIP lookup failed for IP {}: {}", ip_address, e);
                None
            }
        };
        
        self.ip_cache.insert(ip_address.to_string(), result.clone());
        result
    }
}
