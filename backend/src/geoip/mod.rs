use maxminddb::geoip2;
use std::net::IpAddr;
use std::sync::Arc;
use tracing::{info, warn, debug};
use crate::config::{Config, GeolocationMode};
use crate::ip_parser::anonymize_ip;
use crate::geoip_updater::{GeoIpWatchRx, MmdbSource};
use moka::sync::Cache;
use std::time::Duration;

const CACHE_TTI: Duration = Duration::from_secs(1200);
const CACHE_SIZE: u64 = 100000; // Cache up to 100k IP addresses
const READER_UPDATE_CHECK_INTERVAL: Duration = Duration::from_secs(1200);

#[derive(Clone, Debug, Default)]
pub struct GeoLocation {
    pub country_code: Option<String>,
    pub subdivision_code: Option<String>,
    pub city: Option<String>,
}

#[derive(Clone)]
pub struct GeoIpService {
    source: MmdbSource,
    cache: Cache<String, GeoLocation>,
    geolocation_mode: GeolocationMode,
}

impl GeoIpService {
    pub fn new(config: Arc<Config>, geoip_watch_rx: GeoIpWatchRx) -> Self {
        if !config.geolocation_mode.is_enabled() {
            info!("Geolocation is disabled via config.");
        }
        let db_path = config.geolocation_mode.is_enabled().then(|| config.geoip_db_path.as_path());
        Self {
            source: MmdbSource::new(db_path, "GeoIP", geoip_watch_rx, READER_UPDATE_CHECK_INTERVAL),
            cache: Cache::builder().max_capacity(CACHE_SIZE).time_to_idle(CACHE_TTI).build(),
            geolocation_mode: config.geolocation_mode,
        }
    }

    pub fn lookup(&self, ip_address: &str) -> GeoLocation {
        if ip_address == "127.0.0.1" || ip_address == "::1" {
            return GeoLocation {
                country_code: Some("Localhost".to_string()),
                subdivision_code: None,
                city: None,
            };
        }

        let anonymized = anonymize_ip(ip_address).unwrap_or_else(|| ip_address.to_string());

        if let Some(cached_result) = self.cache.get(&anonymized) {
            debug!("GeoIP cache hit");
            return cached_result;
        }

        debug!("GeoIP cache miss");

        if self.source.refresh_if_due() {
            self.cache.invalidate_all();
            info!("GeoIP cache cleared due to database update");
        }

        let reader = match self.source.reader() {
            Some(r) => r,
            None => {
                let result = GeoLocation::default();
                self.cache.insert(anonymized, result.clone());
                return result;
            }
        };

        let ip: IpAddr = match anonymized.parse() {
            Ok(ip) => ip,
            Err(e) => {
                warn!("Failed to parse IP address: {}", e);
                return GeoLocation::default();
            }
        };

        let result = if self.geolocation_mode.has_subdivisions() {
            match reader.lookup::<geoip2::City>(ip) {
                Ok(Some(city)) => {
                    let country_code = city.country
                        .and_then(|c| c.iso_code)
                        .map(|s| s.to_string());

                    let subdivision_code = city.subdivisions
                        .as_ref()
                        .and_then(|subs| subs.first())
                        .and_then(|sub| sub.iso_code)
                        .and_then(|sub_code| {
                            country_code.as_ref().map(|cc| format!("{}-{}", cc, sub_code))
                        });

                    let city_name = city.city
                        .and_then(|c| c.names)
                        .and_then(|names| names.get("en").map(|s| s.to_string()));

                    GeoLocation {
                        country_code,
                        subdivision_code,
                        city: city_name,
                    }
                }
                Ok(None) => GeoLocation::default(),
                Err(e) => {
                    warn!("GeoIP City lookup failed: {}", e);
                    GeoLocation::default()
                }
            }
        } else {
            match reader.lookup::<geoip2::Country>(ip) {
                Ok(Some(country)) => {
                    let country_code = country.country
                        .and_then(|c| c.iso_code)
                        .map(|s| s.to_string());

                    GeoLocation {
                        country_code,
                        subdivision_code: None,
                        city: None,
                    }
                }
                Ok(None) => GeoLocation::default(),
                Err(e) => {
                    warn!("GeoIP Country lookup failed: {}", e);
                    GeoLocation::default()
                }
            }
        };

        self.cache.insert(anonymized, result.clone());

        result
    }
}
