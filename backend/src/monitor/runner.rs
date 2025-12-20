use std::collections::{HashMap, HashSet};
use std::marker::PhantomData;
use std::sync::Arc;
use std::time::Duration as StdDuration;
use std::{future::Future, pin::Pin};

use rand::Rng;
use tokio::sync::Semaphore;
use tokio::task::JoinSet;
use tokio::time::{Instant, MissedTickBehavior, interval};
use tracing::{debug, info, warn};

use crate::metrics::MetricsCollector;
use crate::monitor::alert::{AlertContext, AlertService};
use crate::monitor::{
    BackoffController, BackoffPolicy, BackoffSnapshot, MonitorCache, MonitorCheck, MonitorProbe,
    MonitorResultRow, MonitorWriter, ProbeOutcome,
};

const BACKOFF_JITTER_PCT: f64 = 0.10;

// Runtime Configurations
#[derive(Clone, Copy, Debug)]
pub struct HttpRuntimeConfig {
    pub scheduler_tick: StdDuration,
    pub max_concurrency: usize,
}

impl Default for HttpRuntimeConfig {
    fn default() -> Self {
        Self {
            scheduler_tick: StdDuration::from_millis(1_000),
            max_concurrency: 200,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct TlsRuntimeConfig {
    pub scheduler_tick: StdDuration,
    pub max_concurrency: usize,
    pub probe_interval: StdDuration,
}

impl Default for TlsRuntimeConfig {
    fn default() -> Self {
        Self {
            scheduler_tick: StdDuration::from_millis(60_000),
            max_concurrency: 20,
            probe_interval: StdDuration::from_secs(6 * 60 * 60),
        }
    }
}

type ProbeFuture = Pin<Box<dyn Future<Output = ProbeOutcome> + Send + 'static>>;

/// Strategy trait that defines variant-specific runner behavior.
pub trait RunnerStrategy: Send + Sync + 'static {
    type Scheduler: ProbeScheduler;
    type RuntimeConfig: Clone + Copy + Send + Sync + 'static;

    fn name() -> &'static str;
    fn metrics_kind() -> &'static str;
    fn prune_every_ticks() -> u64;
    fn is_tls_runner() -> bool;

    fn scheduler_tick(runtime: &Self::RuntimeConfig) -> StdDuration;
    fn max_concurrency(runtime: &Self::RuntimeConfig) -> usize;
    fn create_scheduler(runtime: &Self::RuntimeConfig) -> Self::Scheduler;
    fn probe_fn(probe: MonitorProbe, check: Arc<MonitorCheck>) -> ProbeFuture;
    fn build_row(check: &MonitorCheck, outcome: &ProbeOutcome, backoff: &BackoffSnapshot) -> MonitorResultRow;
}

pub struct HttpRunnerStrategy;

impl RunnerStrategy for HttpRunnerStrategy {
    type Scheduler = BackoffScheduler;
    type RuntimeConfig = HttpRuntimeConfig;

    fn name() -> &'static str { "monitor" }
    fn metrics_kind() -> &'static str { "http" }
    fn prune_every_ticks() -> u64 { 3_600 } // ~60 minutes at 1s scheduler tick
    fn is_tls_runner() -> bool { false }

    fn scheduler_tick(runtime: &Self::RuntimeConfig) -> StdDuration {
        runtime.scheduler_tick
    }

    fn max_concurrency(runtime: &Self::RuntimeConfig) -> usize {
        runtime.max_concurrency
    }

    fn create_scheduler(_runtime: &Self::RuntimeConfig) -> Self::Scheduler {
        BackoffScheduler::new()
    }

    fn probe_fn(probe: MonitorProbe, check: Arc<MonitorCheck>) -> ProbeFuture {
        Box::pin(async move { probe.run(&check).await })
    }

    fn build_row(check: &MonitorCheck, outcome: &ProbeOutcome, backoff: &BackoffSnapshot) -> MonitorResultRow {
        MonitorResultRow::from_probe(check, outcome, backoff)
    }
}

pub struct TlsRunnerStrategy;

impl RunnerStrategy for TlsRunnerStrategy {
    type Scheduler = FixedIntervalScheduler;
    type RuntimeConfig = TlsRuntimeConfig;

    fn name() -> &'static str { "tls" }
    fn metrics_kind() -> &'static str { "tls" }
    fn prune_every_ticks() -> u64 { 60 } // ~60 minutes at 60s scheduler tick
    fn is_tls_runner() -> bool { true }

    fn scheduler_tick(runtime: &Self::RuntimeConfig) -> StdDuration {
        runtime.scheduler_tick
    }

    fn max_concurrency(runtime: &Self::RuntimeConfig) -> usize {
        runtime.max_concurrency
    }

    fn create_scheduler(runtime: &Self::RuntimeConfig) -> Self::Scheduler {
        FixedIntervalScheduler::new(runtime.probe_interval)
    }

    fn probe_fn(probe: MonitorProbe, check: Arc<MonitorCheck>) -> ProbeFuture {
        Box::pin(async move { probe.run_tls(&check).await })
    }

    fn build_row(check: &MonitorCheck, outcome: &ProbeOutcome, _backoff: &BackoffSnapshot) -> MonitorResultRow {
        info!(
            check = %check.id,
            status = ?outcome.status,
            reason = %outcome.reason_code.as_str(),
            days_left = ?outcome.tls_days_left,
            "tls probe completed"
        );
        MonitorResultRow::from_tls_probe(check, outcome)
    }
}

pub struct Runner<S: RunnerStrategy> {
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    alert_service: Option<Arc<AlertService>>,
    runtime: S::RuntimeConfig,
    _marker: PhantomData<S>,
}

impl<S: RunnerStrategy> Runner<S> {
    pub fn new(
        cache: Arc<MonitorCache>,
        probe: MonitorProbe,
        writer: Arc<MonitorWriter>,
        metrics: Option<Arc<MetricsCollector>>,
        runtime: S::RuntimeConfig,
    ) -> Self {
        Self {
            cache,
            probe,
            writer,
            metrics,
            alert_service: None,
            runtime,
            _marker: PhantomData,
        }
    }

    pub fn with_alert_service(mut self, alert_service: Arc<AlertService>) -> Self {
        self.alert_service = Some(alert_service);
        self
    }

    /// Spawn the runner with automatic restart supervision.
    /// If the run loop exits unexpectedly, it will restart with exponential backoff.
    pub fn spawn(self) {
        let runner_name = S::name();
        let cache = self.cache;
        let probe = self.probe;
        let writer = self.writer;
        let metrics = self.metrics;
        let alert_service = self.alert_service;
        let runtime = self.runtime;

        tokio::spawn(async move {
            let mut restart_count: u32 = 0;
            const MAX_BACKOFF_SECS: u64 = 60;
            const BASE_BACKOFF_SECS: u64 = 1;

            loop {
                let config = RunLoopConfig {
                    name: S::name(),
                    scheduler_tick: S::scheduler_tick(&runtime),
                    max_concurrency: S::max_concurrency(&runtime),
                    prune_every_ticks: S::prune_every_ticks(),
                    metrics_kind: S::metrics_kind(),
                };
                let scheduler = S::create_scheduler(&runtime);

                info!(
                    runner = runner_name,
                    restart_count = restart_count,
                    "Starting monitor runner"
                );

                // /his should run forever unless something goes wrong
                run_loop::<S>(
                    Arc::clone(&cache),
                    probe.clone(),
                    Arc::clone(&writer),
                    metrics.clone(),
                    alert_service.clone(),
                    config,
                    scheduler,
                )
                .await;

                // If we get here, the run loop exited unexpectedly
                restart_count = restart_count.saturating_add(1);
                let backoff_secs = (BASE_BACKOFF_SECS << restart_count.min(6)).min(MAX_BACKOFF_SECS);

                tracing::error!(
                    runner = runner_name,
                    restart_count = restart_count,
                    backoff_secs = backoff_secs,
                    "Monitor runner exited unexpectedly - restarting after backoff"
                );

                tokio::time::sleep(StdDuration::from_secs(backoff_secs)).await;
            }
        });
    }
}

pub type HttpRunner = Runner<HttpRunnerStrategy>;
pub type TlsRunner = Runner<TlsRunnerStrategy>;

#[derive(Clone, Copy, Debug)]
struct RunLoopConfig {
    name: &'static str,
    scheduler_tick: StdDuration,
    max_concurrency: usize,
    prune_every_ticks: u64,
    metrics_kind: &'static str,
}

/// Trait for scheduling when monitors should be probed.
pub trait ProbeScheduler: Send + Sync + 'static {
    /// Check if a monitor is eligible for probing and return the backoff snapshot if so.
    fn check_due(
        &mut self,
        check: &MonitorCheck,
        now: Instant,
        last_run: &HashMap<String, Instant>,
    ) -> Option<BackoffSnapshot>;

    /// Called after a probe completes to update internal state.
    fn apply_outcome(
        &mut self,
        check: &MonitorCheck,
        outcome: &ProbeOutcome,
        finished_at: Instant,
    ) -> BackoffSnapshot;

    /// Prune stale state for monitors that no longer exist.
    fn prune_inactive(&mut self, active_ids: &HashSet<String>);
}

/// Scheduler with exponential backoff for failing monitors.
pub struct BackoffScheduler {
    backoff: BackoffController,
    next_wait: HashMap<String, StdDuration>,
}

impl BackoffScheduler {
    pub fn new() -> Self {
        Self {
            backoff: BackoffController::new(BackoffPolicy::default()),
            next_wait: HashMap::new(),
        }
    }
}

impl ProbeScheduler for BackoffScheduler {
    fn check_due(
        &mut self,
        check: &MonitorCheck,
        now: Instant,
        last_run: &HashMap<String, Instant>,
    ) -> Option<BackoffSnapshot> {
        let snapshot = self.backoff.current_snapshot(check);
        let wait = self
            .next_wait
            .entry(check.id.clone())
            .or_insert_with(|| jitter_duration(snapshot.effective_interval, BACKOFF_JITTER_PCT));

        let is_due = match last_run.get(&check.id) {
            Some(ts) => now.duration_since(*ts) >= *wait,
            None => true,
        };

        if is_due {
            Some(snapshot)
        } else {
            None
        }
    }

    fn apply_outcome(
        &mut self,
        check: &MonitorCheck,
        outcome: &ProbeOutcome,
        _finished_at: Instant,
    ) -> BackoffSnapshot {
        let snapshot = self.backoff.apply_outcome(check, outcome);
        self.next_wait.insert(
            check.id.clone(),
            jitter_duration(snapshot.effective_interval, BACKOFF_JITTER_PCT),
        );
        snapshot
    }

    fn prune_inactive(&mut self, active_ids: &HashSet<String>) {
        self.backoff.prune_inactive(active_ids);
        self.next_wait.retain(|id, _| active_ids.contains(id));
    }
}

/// Scheduler with a fixed interval (used for TLS probes).
pub struct FixedIntervalScheduler {
    probe_interval: StdDuration,
}

impl FixedIntervalScheduler {
    pub fn new(probe_interval: StdDuration) -> Self {
        Self { probe_interval }
    }
}

impl ProbeScheduler for FixedIntervalScheduler {
    fn check_due(
        &mut self,
        check: &MonitorCheck,
        now: Instant,
        last_run: &HashMap<String, Instant>,
    ) -> Option<BackoffSnapshot> {
        // Skip if not HTTPS or if SSL checks are disabled
        if check.url.scheme() != "https" || !check.check_ssl_errors {
            return None;
        }

        let is_due = match last_run.get(&check.id) {
            Some(ts) => now.duration_since(*ts) >= self.probe_interval,
            None => true,
        };

        if is_due {
            Some(BackoffSnapshot::from_base_interval(check.interval))
        } else {
            None
        }
    }

    fn apply_outcome(
        &mut self,
        check: &MonitorCheck,
        _outcome: &ProbeOutcome,
        _finished_at: Instant,
    ) -> BackoffSnapshot {
        BackoffSnapshot::from_base_interval(check.interval)
    }

    fn prune_inactive(&mut self, _active_ids: &HashSet<String>) {
        // No state to prune
    }
}

async fn run_loop<S: RunnerStrategy>(
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    alert_service: Option<Arc<AlertService>>,
    config: RunLoopConfig,
    mut scheduler: S::Scheduler,
) {
    let mut ticker = interval(config.scheduler_tick);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
    let semaphore = Arc::new(Semaphore::new(config.max_concurrency));
    let mut last_run: HashMap<String, Instant> = HashMap::new();
    let mut prune_counter: u64 = 0;
    let runner_name = config.name;
    let metrics_kind = config.metrics_kind;
    let is_tls_runner = S::is_tls_runner();

    info!(
        runner = config.name,
        tick_ms = config.scheduler_tick.as_millis(),
        max_concurrency = config.max_concurrency,
        alerts_enabled = alert_service.is_some(),
        "monitor runner started"
    );

    loop {
        ticker.tick().await;
        prune_counter = prune_counter.wrapping_add(1);

        let snapshot = cache.snapshot();
        if snapshot.is_empty() {
            continue;
        }

        // Prune stale state periodically
        if prune_counter % config.prune_every_ticks == 0 {
            let active_ids: HashSet<String> = snapshot.iter().map(|c| c.id.clone()).collect();
            scheduler.prune_inactive(&active_ids);
            last_run.retain(|id, _| active_ids.contains(id));
            
            // Also prune alert service state
            if let Some(ref alert_svc) = alert_service {
                alert_svc.prune_inactive(&active_ids).await;
            }
        }

        let now = Instant::now();
        let mut set = JoinSet::new();

        for check in snapshot {
            if scheduler.check_due(&check, now, &last_run).is_none() {
                continue;
            }

            let probe = probe.clone();
            let metrics = metrics.clone();
            let semaphore = Arc::clone(&semaphore);
            let check_for_probe = check.clone();

            set.spawn(async move {
                let permit = semaphore.acquire_owned().await;
                if permit.is_err() {
                    warn!(
                        runner = runner_name,
                        check = %check.id,
                        "Failed to acquire concurrency permit"
                    );
                    return None;
                }
                let _permit = permit.unwrap();
                let outcome = S::probe_fn(probe.clone(), check_for_probe.clone()).await;
                let finished_at = Instant::now();

                if let Some(metrics) = &metrics {
                    metrics.record_monitor_probe(
                        &check_for_probe.id,
                        if outcome.success { "ok" } else { "fail" },
                        outcome.reason_code.as_str(),
                        metrics_kind,
                        outcome.latency,
                    );
                }

                Some((check_for_probe, outcome, finished_at))
            });
        }

        let mut collected: Vec<MonitorResultRow> = Vec::new();
        while let Some(res) = set.join_next().await {
            if let Ok(Some((check, outcome, finished_at))) = res {
                last_run.insert(check.id.clone(), finished_at);
                let post_snapshot = scheduler.apply_outcome(&check, &outcome, finished_at);

                debug!(
                    runner = runner_name,
                    check = %check.id,
                    status = ?outcome.status,
                    success = outcome.success,
                    reason = %outcome.reason_code.as_str(),
                    latency_ms = outcome.latency.as_millis() as u64,
                    post_failures = post_snapshot.consecutive_failures,
                    post_successes = post_snapshot.consecutive_successes,
                    backoff_level = post_snapshot.backoff_level,
                    "probe completed"
                );

                // Process alerts if alert service is configured
                if let Some(ref alert_svc) = alert_service {
                    let alert_ctx = AlertContext::from_probe(
                        &check,
                        &outcome,
                        post_snapshot.consecutive_failures,
                    );

                    if is_tls_runner {
                        // TLS runner only processes SSL alerts
                        alert_svc.process_tls_probe_outcome(&alert_ctx).await;
                    } else {
                        // HTTP runner processes down/recovery alerts
                        alert_svc.process_probe_outcome(&alert_ctx).await;
                    }
                }

                collected.push(S::build_row(&check, &outcome, &post_snapshot));
            }
        }

        if !collected.is_empty() {
            info!(
                runner = config.name,
                rows = collected.len(),
                "monitor batch ready for insert"
            );
            if let Err(err) = writer.enqueue_rows(collected) {
                warn!(runner = config.name, error = ?err, "Failed to enqueue monitor rows");
            }
        }
    }
}

// Helpers

fn jitter_duration(base: StdDuration, jitter_pct: f64) -> StdDuration {
    let mut rng = rand::thread_rng();
    jitter_duration_with_rng(base, jitter_pct, &mut rng)
}

fn jitter_duration_with_rng<R: Rng + ?Sized>(
    base: StdDuration,
    jitter_pct: f64,
    rng: &mut R,
) -> StdDuration {
    if jitter_pct <= 0.0 {
        return base;
    }

    let pct = jitter_pct.clamp(0.0, 1.0);
    let base_ms: i128 = base.as_millis().max(1) as i128;
    let jitter_span: i128 = ((base_ms as f64) * pct).round() as i128;

    if jitter_span == 0 {
        return base;
    }

    let delta: i128 = rng.gen_range(-jitter_span..=jitter_span);
    let adjusted_ms = (base_ms + delta).max(1);

    StdDuration::from_millis(adjusted_ms as u64)
}
