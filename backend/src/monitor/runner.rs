use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::Duration as StdDuration;
use std::{future::Future, pin::Pin};

use rand::Rng;
use tokio::sync::Semaphore;
use tokio::task::JoinSet;
use tokio::time::{Instant, MissedTickBehavior, interval};
use tracing::{info, warn};

use crate::metrics::MetricsCollector;
use crate::monitor::{
    BackoffController, BackoffPolicy, BackoffSnapshot, MonitorCache, MonitorCheck, MonitorProbe,
    MonitorResultRow, MonitorWriter, ProbeOutcome,
};

const MONITOR_SCHEDULER_TICK_MS: u64 = 1_000;
const MONITOR_MAX_CONCURRENCY: usize = 200;
const TLS_MONITOR_SCHEDULER_TICK_MS: u64 = 60_000;
const TLS_MONITOR_MAX_CONCURRENCY: usize = 20;
const TLS_PROBE_INTERVAL: StdDuration = StdDuration::from_secs(6 * 60 * 60);
const BACKOFF_JITTER_PCT: f64 = 0.10;
const PRUNE_EVERY_TICKS: u64 = 3_600; // ~60 minutes at 1s scheduler tick
const TLS_PRUNE_EVERY_TICKS: u64 = 60; // ~60 minutes at 60s scheduler tick

#[derive(Clone, Copy, Debug)]
pub struct MonitorRuntimeConfig {
    pub scheduler_tick: StdDuration,
    pub max_concurrency: usize,
}

impl Default for MonitorRuntimeConfig {
    fn default() -> Self {
        Self {
            scheduler_tick: StdDuration::from_millis(MONITOR_SCHEDULER_TICK_MS),
            max_concurrency: MONITOR_MAX_CONCURRENCY,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct TlsMonitorRuntimeConfig {
    pub scheduler_tick: StdDuration,
    pub max_concurrency: usize,
    pub probe_interval: StdDuration,
}

impl Default for TlsMonitorRuntimeConfig {
    fn default() -> Self {
        Self {
            scheduler_tick: StdDuration::from_millis(TLS_MONITOR_SCHEDULER_TICK_MS),
            max_concurrency: TLS_MONITOR_MAX_CONCURRENCY,
            probe_interval: TLS_PROBE_INTERVAL,
        }
    }
}

type ProbeFuture = Pin<Box<dyn Future<Output = ProbeOutcome> + Send + 'static>>;

pub struct MonitorRunner {
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    runtime: MonitorRuntimeConfig,
}

impl MonitorRunner {
    pub fn new(
        cache: Arc<MonitorCache>,
        probe: MonitorProbe,
        writer: Arc<MonitorWriter>,
        metrics: Option<Arc<MetricsCollector>>,
        runtime: MonitorRuntimeConfig,
    ) -> Self {
        Self {
            cache,
            probe,
            writer,
            metrics,
            runtime,
        }
    }

    pub fn spawn(self) {
        tokio::spawn(async move {
            self.run().await;
        });
    }

    async fn run(self) {
        let config = RunLoopConfig {
            name: "monitor",
            scheduler_tick: self.runtime.scheduler_tick,
            max_concurrency: self.runtime.max_concurrency,
            prune_every_ticks: PRUNE_EVERY_TICKS,
            metrics_kind: "http",
        };
        let scheduler = BackoffScheduler::new();

        run_loop(
            self.cache,
            self.probe,
            self.writer,
            self.metrics,
            config,
            scheduler,
            |probe, check| Box::pin(async move { probe.run(&check).await }),
            |check, outcome, backoff| MonitorResultRow::from_probe(check, outcome, backoff),
            |_check, _outcome| {},
        )
        .await
    }
}

pub struct TlsMonitorRunner {
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    runtime: TlsMonitorRuntimeConfig,
}

impl TlsMonitorRunner {
    pub fn new(
        cache: Arc<MonitorCache>,
        probe: MonitorProbe,
        writer: Arc<MonitorWriter>,
        metrics: Option<Arc<MetricsCollector>>,
        runtime: TlsMonitorRuntimeConfig,
    ) -> Self {
        Self {
            cache,
            probe,
            writer,
            metrics,
            runtime,
        }
    }

    pub fn spawn(self) {
        tokio::spawn(async move {
            self.run().await;
        });
    }

    async fn run(self) {
        let config = RunLoopConfig {
            name: "tls",
            scheduler_tick: self.runtime.scheduler_tick,
            max_concurrency: self.runtime.max_concurrency,
            prune_every_ticks: TLS_PRUNE_EVERY_TICKS,
            metrics_kind: "tls",
        };
        let scheduler = FixedIntervalScheduler::new(self.runtime.probe_interval);

        run_loop(
            self.cache,
            self.probe,
            self.writer,
            self.metrics,
            config,
            scheduler,
            |probe, check| Box::pin(async move { probe.run_tls(&check).await }),
            |check, outcome, backoff| {
                info!(
                    check = %check.id,
                    status = ?outcome.status,
                    reason = %outcome.reason_code.as_str(),
                    days_left = ?outcome.tls_days_left,
                    "tls probe completed"
                );
                // TLS probes use a fixed backoff snapshot from the check's interval
                let _ = backoff;
                MonitorResultRow::from_tls_probe(check, outcome)
            },
            |_check, _outcome| {},
        )
        .await
    }
}

#[derive(Clone, Copy, Debug)]
struct RunLoopConfig {
    name: &'static str,
    scheduler_tick: StdDuration,
    max_concurrency: usize,
    prune_every_ticks: u64,
    metrics_kind: &'static str,
}

/// Trait for scheduling when monitors should be probed.
trait ProbeScheduler: Send + Sync + 'static {
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
struct BackoffScheduler {
    backoff: BackoffController,
    next_wait: HashMap<String, StdDuration>,
}

impl BackoffScheduler {
    fn new() -> Self {
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
struct FixedIntervalScheduler {
    probe_interval: StdDuration,
}

impl FixedIntervalScheduler {
    fn new(probe_interval: StdDuration) -> Self {
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

async fn run_loop<S, FProbe, FRow, FLog>(
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    config: RunLoopConfig,
    mut scheduler: S,
    probe_fn: FProbe,
    build_row: FRow,
    log_probe: FLog,
) where
    S: ProbeScheduler,
    FProbe: Fn(MonitorProbe, Arc<MonitorCheck>) -> ProbeFuture + Copy + Send + Sync + 'static,
    FRow: Fn(&MonitorCheck, &ProbeOutcome, &BackoffSnapshot) -> MonitorResultRow
        + Copy
        + Send
        + Sync
        + 'static,
    FLog: Fn(&MonitorCheck, &ProbeOutcome) + Copy + Send + Sync + 'static,
{
    let mut ticker = interval(config.scheduler_tick);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
    let semaphore = Arc::new(Semaphore::new(config.max_concurrency));
    let mut last_run: HashMap<String, Instant> = HashMap::new();
    let mut prune_counter: u64 = 0;
    let runner_name = config.name;
    let metrics_kind = config.metrics_kind;

    info!(
        runner = config.name,
        tick_ms = config.scheduler_tick.as_millis(),
        max_concurrency = config.max_concurrency,
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
        }

        let now = Instant::now();
        let mut set = JoinSet::new();

        for check in snapshot {
            let Some(pre_snapshot) = scheduler.check_due(&check, now, &last_run) else {
                continue;
            };

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
                let outcome = probe_fn(probe.clone(), check_for_probe.clone()).await;
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

                log_probe(&check_for_probe, &outcome);

                Some((check_for_probe, outcome, finished_at, pre_snapshot))
            });
        }

        let mut collected: Vec<MonitorResultRow> = Vec::new();
        while let Some(res) = set.join_next().await {
            if let Ok(Some((check, outcome, finished_at, _pre_snapshot))) = res {
                last_run.insert(check.id.clone(), finished_at);
                let post_snapshot = scheduler.apply_outcome(&check, &outcome, finished_at);
                collected.push(build_row(&check, &outcome, &post_snapshot));
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
