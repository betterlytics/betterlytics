use crate::config::Config;
use crate::geoip_updater::{GeoIpWatchRx, MmdbSource};
use crate::ip_parser::anonymize_ip;
use maxminddb::geoip2;
use moka::sync::Cache;
use std::net::IpAddr;
use std::sync::Arc;
use std::time::Duration;
use tracing::{debug, info, warn};

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
    source: MmdbSource,
    cache: Cache<String, AsnInfo>,
}

impl AsnService {
    pub fn new(config: Arc<Config>, watch_rx: GeoIpWatchRx) -> Self {
        Self {
            source: MmdbSource::new(Some(&config.asn_db_path), "ASN", watch_rx, READER_UPDATE_CHECK_INTERVAL),
            cache: Cache::builder().max_capacity(CACHE_SIZE).time_to_idle(CACHE_TTI).build(),
        }
    }

    /// Returns `AsnInfo::default()` (asn 0, empty org) when the database is
    /// unavailable or the IP is unknown (best-effort).
    pub fn lookup(&self, ip_address: &str) -> AsnInfo {
        if ip_address == "127.0.0.1" || ip_address == "::1" {
            return AsnInfo::default();
        }

        let anonymized = anonymize_ip(ip_address).unwrap_or_else(|| ip_address.to_string());

        if let Some(cached) = self.cache.get(&anonymized) {
            return cached;
        }

        if self.source.refresh_if_due() {
            self.cache.invalidate_all();
            info!("ASN cache cleared due to database update");
        }

        let reader = match self.source.reader() {
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
