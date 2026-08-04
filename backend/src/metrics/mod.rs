use prometheus::{
    Encoder, Gauge, GaugeVec, Histogram, HistogramOpts, HistogramVec, IntCounter, IntCounterVec,
    Opts, Registry, TextEncoder,
};
use std::sync::Arc;
use std::time::Duration;
use sysinfo::{Pid, ProcessesToUpdate, System, get_current_pid};
use tokio::sync::RwLock;
use tracing::{error, info};

#[derive(Clone)]
pub struct MetricsCollector {
    registry: Registry,

    // System-wide metrics (entire system including all processes)
    system_cpu_usage: Gauge,
    system_memory_usage: Gauge,
    system_memory_total: Gauge,

    // Rust application-specific metrics (this process only)
    process_cpu_usage: Gauge,
    process_memory_usage: Gauge,
    events_processed_total: IntCounter,
    events_processing_duration: Histogram,

    // Event rejection and validation metrics
    events_rejected_total: IntCounterVec,
    events_dropped_total: IntCounterVec,
    validation_duration: Histogram,

    // Ingest pipeline pressure
    ingest_channel_depth: Gauge,
    inserter_batch_rows: Gauge,
    inserter_retry_attempts: Gauge,
    events_inserted_total: IntCounter,
    writer_queue_depth: GaugeVec,

    // Cache lookup metrics
    cache_lookups_total: IntCounterVec,

    // Site-config cache health/time
    site_config_cache_healthy: Gauge,
    site_config_last_refresh_timestamp_seconds: Gauge,
    site_config_cache_entries: Gauge,

    // Monitor cache health/time
    monitor_cache_healthy: Gauge,
    monitor_cache_last_refresh_timestamp_seconds: Gauge,
    monitor_cache_entries: Gauge,

    // Monitoring probes
    monitor_probe_success_total: IntCounterVec,
    monitor_probe_reason_total: IntCounterVec,
    monitor_probe_total: IntCounter,
    monitor_probe_latency_seconds: HistogramVec,
    monitor_active_probes: Gauge,

    // System info
    system: Arc<RwLock<System>>,
    current_pid: Pid,
}

impl MetricsCollector {
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let registry = Registry::new();

        let system_cpu_usage = Gauge::with_opts(Opts::new(
            "system_cpu_usage_percent",
            "System-wide CPU usage percentage (all processes)",
        ))?;

        let system_memory_usage = Gauge::with_opts(Opts::new(
            "system_memory_usage_bytes",
            "System-wide memory usage in bytes (all processes)",
        ))?;

        let system_memory_total = Gauge::with_opts(Opts::new(
            "system_memory_total_bytes",
            "Total system memory in bytes",
        ))?;

        let process_cpu_usage = Gauge::with_opts(Opts::new(
            "process_cpu_usage_percent",
            "Rust application CPU usage percentage (this process only)",
        ))?;

        let process_memory_usage = Gauge::with_opts(Opts::new(
            "process_memory_usage_bytes",
            "Rust application memory usage in bytes (this process only)",
        ))?;

        let events_processed_total = IntCounter::with_opts(Opts::new(
            "analytics_events_processed_total",
            "Total number of analytics events processed",
        ))?;

        let events_processing_duration = Histogram::with_opts(HistogramOpts::new(
            "analytics_events_processing_duration_seconds",
            "Time spent processing analytics events",
        ))?;

        let events_rejected_total = IntCounterVec::new(
            Opts::new(
                "analytics_events_rejected_total",
                "Total number of analytics events rejected by validation",
            ),
            &["reason"],
        )?;

        let events_dropped_total = IntCounterVec::new(
            Opts::new(
                "analytics_events_dropped_total",
                "Total number of accepted analytics events lost before reaching ClickHouse",
            ),
            &["reason"],
        )?;

        let ingest_channel_depth = Gauge::with_opts(Opts::new(
            "analytics_ingest_channel_depth",
            "Events waiting in the ingest channel",
        ))?;

        let inserter_batch_rows = Gauge::with_opts(Opts::new(
            "analytics_inserter_batch_rows",
            "Rows held in the inserter's current batch",
        ))?;

        let inserter_retry_attempts = Gauge::with_opts(Opts::new(
            "analytics_inserter_retry_attempts",
            "Consecutive failed insert attempts for the current batch (0 = healthy)",
        ))?;

        let events_inserted_total = IntCounter::with_opts(Opts::new(
            "analytics_events_inserted_total",
            "Total events confirmed inserted into ClickHouse",
        ))?;

        let writer_queue_depth = GaugeVec::new(
            Opts::new(
                "writer_queue_depth",
                "Queued batches per ClickHouse channel writer",
            ),
            &["table"],
        )?;

        let validation_duration = Histogram::with_opts(HistogramOpts::new(
            "analytics_validation_duration_seconds",
            "Time spent validating analytics events",
        ))?;

        let cache_lookups_total = IntCounterVec::new(
            Opts::new(
                "cache_lookups_total",
                "Total number of cache lookups grouped by cache and result",
            ),
            &["cache", "result"],
        )?;

        let site_config_cache_healthy = Gauge::with_opts(Opts::new(
            "site_config_cache_healthy",
            "Health of the site-config cache (1=healthy, 0=unhealthy; based on refresh recency)",
        ))?;

        let site_config_last_refresh_timestamp_seconds = Gauge::with_opts(Opts::new(
            "site_config_last_refresh_timestamp_seconds",
            "Unix timestamp (seconds) of the last successful site-config refresh",
        ))?;

        let site_config_cache_entries = Gauge::with_opts(Opts::new(
            "site_config_cache_entries",
            "Number of site-config entries currently loaded in memory",
        ))?;

        let monitor_cache_healthy = Gauge::with_opts(Opts::new(
            "monitor_cache_healthy",
            "Health of the monitor cache (1=healthy, 0=unhealthy; based on refresh recency)",
        ))?;

        let monitor_cache_last_refresh_timestamp_seconds = Gauge::with_opts(Opts::new(
            "monitor_cache_last_refresh_timestamp_seconds",
            "Unix timestamp (seconds) of the last successful monitor cache refresh",
        ))?;

        let monitor_cache_entries = Gauge::with_opts(Opts::new(
            "monitor_cache_entries",
            "Number of monitor checks currently loaded in memory",
        ))?;

        let monitor_probe_success_total = IntCounterVec::new(
            Opts::new(
                "monitor_probe_success_total",
                "Total probes grouped by result",
            ),
            &["check", "status"],
        )?;

        let monitor_probe_reason_total = IntCounterVec::new(
            Opts::new(
                "monitor_probe_reason_total",
                "Total probes grouped by reason_code",
            ),
            &["check", "reason"],
        )?;

        let monitor_probe_total = IntCounter::with_opts(Opts::new(
            "monitor_probe_total",
            "Total monitor probes executed",
        ))?;

        let monitor_probe_latency_seconds = HistogramVec::new(
            HistogramOpts::new(
                "monitor_probe_latency_seconds",
                "Probe latency in seconds, grouped by kind",
            ),
            &["kind"],
        )?;

        let monitor_active_probes = Gauge::with_opts(Opts::new(
            "monitor_active_probes",
            "Current number of concurrent monitor probes in flight",
        ))?;

        registry.register(Box::new(system_cpu_usage.clone()))?;
        registry.register(Box::new(system_memory_usage.clone()))?;
        registry.register(Box::new(system_memory_total.clone()))?;
        registry.register(Box::new(process_cpu_usage.clone()))?;
        registry.register(Box::new(process_memory_usage.clone()))?;
        registry.register(Box::new(events_processed_total.clone()))?;
        registry.register(Box::new(events_processing_duration.clone()))?;
        registry.register(Box::new(events_rejected_total.clone()))?;
        registry.register(Box::new(events_dropped_total.clone()))?;
        registry.register(Box::new(ingest_channel_depth.clone()))?;
        registry.register(Box::new(inserter_batch_rows.clone()))?;
        registry.register(Box::new(inserter_retry_attempts.clone()))?;
        registry.register(Box::new(events_inserted_total.clone()))?;
        registry.register(Box::new(writer_queue_depth.clone()))?;
        registry.register(Box::new(validation_duration.clone()))?;
        registry.register(Box::new(cache_lookups_total.clone()))?;
        registry.register(Box::new(site_config_cache_healthy.clone()))?;
        registry.register(Box::new(site_config_last_refresh_timestamp_seconds.clone()))?;
        registry.register(Box::new(site_config_cache_entries.clone()))?;
        registry.register(Box::new(monitor_cache_healthy.clone()))?;
        registry.register(Box::new(
            monitor_cache_last_refresh_timestamp_seconds.clone(),
        ))?;
        registry.register(Box::new(monitor_cache_entries.clone()))?;
        registry.register(Box::new(monitor_probe_success_total.clone()))?;
        registry.register(Box::new(monitor_probe_reason_total.clone()))?;
        registry.register(Box::new(monitor_probe_total.clone()))?;
        registry.register(Box::new(monitor_probe_latency_seconds.clone()))?;
        registry.register(Box::new(monitor_active_probes.clone()))?;

        let mut system = System::new_all();
        system.refresh_all(); // This refresh is an attempt to ensure that when the metrics_updater starts it has accurate initial values

        let current_pid =
            get_current_pid().map_err(|e| format!("Failed to get current process ID: {}", e))?;

        let collector = Self {
            registry,
            system_cpu_usage,
            system_memory_usage,
            system_memory_total,
            process_cpu_usage,
            process_memory_usage,
            events_processed_total,
            events_processing_duration,
            events_rejected_total,
            events_dropped_total,
            ingest_channel_depth,
            inserter_batch_rows,
            inserter_retry_attempts,
            events_inserted_total,
            writer_queue_depth,
            validation_duration,
            cache_lookups_total,
            site_config_cache_healthy,
            site_config_last_refresh_timestamp_seconds,
            site_config_cache_entries,
            monitor_cache_healthy,
            monitor_cache_last_refresh_timestamp_seconds,
            monitor_cache_entries,
            monitor_probe_success_total,
            monitor_probe_reason_total,
            monitor_probe_total,
            monitor_probe_latency_seconds,
            monitor_active_probes,
            system: Arc::new(RwLock::new(system)),
            current_pid,
        };

        info!("Metrics collector initialized successfully");
        Ok(collector)
    }

    /// Background task to update system metrics
    pub fn start_system_metrics_updater(self) -> Arc<Self> {
        let collector = Arc::new(self);
        let collector_clone = Arc::clone(&collector);

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(5));

            loop {
                interval.tick().await;

                if let Err(e) = collector_clone.update_system_metrics().await {
                    error!("Failed to update system metrics: {}", e);
                }
            }
        });

        collector
    }

    async fn update_system_metrics(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut system = self.system.write().await;

        // Refresh system information, this is needed to get new CPU and memory usage values
        system.refresh_cpu_all();
        system.refresh_memory();
        system.refresh_processes(ProcessesToUpdate::Some(&[self.current_pid]), true);

        let system_cpu_usage = system.cpus().iter().map(|cpu| cpu.cpu_usage()).sum::<f32>()
            / system.cpus().len() as f32;
        self.system_cpu_usage.set(system_cpu_usage as f64);

        let used_memory = system.used_memory();
        let total_memory = system.total_memory();
        self.system_memory_usage.set(used_memory as f64);
        self.system_memory_total.set(total_memory as f64);

        // Rust application metrics
        if let Some(process) = system.process(self.current_pid) {
            let process_cpu = process.cpu_usage();
            let process_memory = process.memory();

            self.process_cpu_usage.set(process_cpu as f64);
            self.process_memory_usage.set(process_memory as f64);
        }

        Ok(())
    }

    pub fn increment_events_processed(&self) {
        self.events_processed_total.inc();
    }

    pub fn record_processing_duration(&self, duration: Duration) {
        self.events_processing_duration
            .observe(duration.as_secs_f64());
    }

    pub fn increment_events_rejected(&self, reason: &str) {
        self.events_rejected_total
            .with_label_values(&[reason])
            .inc();
    }

    /// Counts accepted (200-acked) events that were lost before reaching
    /// ClickHouse - the alertable "silent loss" signal from issue #19.
    pub fn increment_events_dropped(&self, reason: &str, count: u64) {
        self.events_dropped_total
            .with_label_values(&[reason])
            .inc_by(count);
    }

    pub fn record_validation_duration(&self, duration: Duration) {
        self.validation_duration.observe(duration.as_secs_f64());
    }

    pub fn increment_cache_lookup(&self, cache: &str, result: &str) {
        self.cache_lookups_total
            .with_label_values(&[cache, result])
            .inc();
    }

    pub fn set_site_config_cache_healthy(&self, healthy: bool) {
        self.site_config_cache_healthy
            .set(if healthy { 1.0 } else { 0.0 });
    }

    pub fn set_site_config_last_refresh_timestamp_seconds(&self, ts_seconds: f64) {
        self.site_config_last_refresh_timestamp_seconds
            .set(ts_seconds);
    }

    pub fn set_site_config_cache_entries(&self, count: f64) {
        self.site_config_cache_entries.set(count);
    }

    pub fn set_monitor_cache_healthy(&self, healthy: bool) {
        self.monitor_cache_healthy
            .set(if healthy { 1.0 } else { 0.0 });
    }

    pub fn set_monitor_cache_last_refresh_timestamp_seconds(&self, ts_seconds: f64) {
        self.monitor_cache_last_refresh_timestamp_seconds
            .set(ts_seconds);
    }

    pub fn set_monitor_cache_entries(&self, count: f64) {
        self.monitor_cache_entries.set(count);
    }

    pub fn record_monitor_probe(
        &self,
        check_id: &str,
        status: &str,
        reason_code: &str,
        kind: &str,
        latency: Duration,
    ) {
        self.monitor_probe_success_total
            .with_label_values(&[check_id, status])
            .inc();
        self.monitor_probe_reason_total
            .with_label_values(&[check_id, reason_code])
            .inc();
        self.monitor_probe_total.inc();
        self.monitor_probe_latency_seconds
            .with_label_values(&[kind])
            .observe(latency.as_secs_f64());
    }

    pub fn set_monitor_active_probes(&self, count: usize) {
        self.monitor_active_probes.set(count as f64);
    }

    pub fn set_ingest_channel_depth(&self, depth: usize) {
        self.ingest_channel_depth.set(depth as f64);
    }

    pub fn set_inserter_batch_rows(&self, rows: usize) {
        self.inserter_batch_rows.set(rows as f64);
    }

    pub fn set_inserter_retry_attempts(&self, attempts: u32) {
        self.inserter_retry_attempts.set(f64::from(attempts));
    }

    pub fn increment_events_inserted(&self, count: u64) {
        self.events_inserted_total.inc_by(count);
    }

    pub fn set_writer_queue_depth(&self, table: &str, depth: usize) {
        self.writer_queue_depth
            .with_label_values(&[table])
            .set(depth as f64);
    }

    pub fn export_metrics(&self) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        let mut buffer = Vec::new();

        encoder.encode(&metric_families, &mut buffer)?;
        let metrics_string = String::from_utf8(buffer)?;

        Ok(metrics_string)
    }
}
