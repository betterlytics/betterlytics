use prometheus::{
    Encoder, Gauge, Histogram, HistogramOpts, IntCounter, Opts, Registry, TextEncoder,
};
use std::sync::Arc;
use std::time::Duration;
use sysinfo::{get_current_pid, Pid, System, ProcessesToUpdate};
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

    // System info
    system: Arc<RwLock<System>>,
    current_pid: Pid,
}

impl MetricsCollector {
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let registry = Registry::new();
        
        let system_cpu_usage = Gauge::with_opts(Opts::new(
            "system_cpu_usage_percent",
            "System-wide CPU usage percentage (all processes)"
        ))?;
        
        let system_memory_usage = Gauge::with_opts(Opts::new(
            "system_memory_usage_bytes", 
            "System-wide memory usage in bytes (all processes)"
        ))?;
        
        let system_memory_total = Gauge::with_opts(Opts::new(
            "system_memory_total_bytes",
            "Total system memory in bytes"
        ))?;
        
        let process_cpu_usage = Gauge::with_opts(Opts::new(
            "process_cpu_usage_percent",
            "Rust application CPU usage percentage (this process only)"
        ))?;
        
        let process_memory_usage = Gauge::with_opts(Opts::new(
            "process_memory_usage_bytes",
            "Rust application memory usage in bytes (this process only)"
        ))?;
        
        let events_processed_total = IntCounter::with_opts(Opts::new(
            "analytics_events_processed_total",
            "Total number of analytics events processed"
        ))?;
        
        let events_processing_duration = Histogram::with_opts(HistogramOpts::new(
            "analytics_events_processing_duration_seconds",
            "Time spent processing analytics events"
        ))?;
        
        registry.register(Box::new(system_cpu_usage.clone()))?;
        registry.register(Box::new(system_memory_usage.clone()))?;
        registry.register(Box::new(system_memory_total.clone()))?;
        registry.register(Box::new(process_cpu_usage.clone()))?;
        registry.register(Box::new(process_memory_usage.clone()))?;
        registry.register(Box::new(events_processed_total.clone()))?;
        registry.register(Box::new(events_processing_duration.clone()))?;
        
        let mut system = System::new_all();
        system.refresh_all(); // This refresh is an attempt to ensure that when the metrics_updater starts it has accurate initial values
        
        let current_pid = get_current_pid()
            .map_err(|e| format!("Failed to get current process ID: {}", e))?;
        
        let collector = Self {
            registry,
            system_cpu_usage,
            system_memory_usage,
            system_memory_total,
            process_cpu_usage,
            process_memory_usage,
            events_processed_total,
            events_processing_duration,
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
        
        let system_cpu_usage = system.cpus().iter()
            .map(|cpu| cpu.cpu_usage())
            .sum::<f32>() / system.cpus().len() as f32;
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
        self.events_processing_duration.observe(duration.as_secs_f64());
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