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
    BackoffController, BackoffPolicy, MonitorCache, MonitorCheck, MonitorProbe, MonitorResultRow,
    MonitorWriter, ProbeOutcome,
};

const MONITOR_SCHEDULER_TICK_MS: u64 = 1_000;
const MONITOR_MAX_CONCURRENCY: usize = 200;
const TLS_MONITOR_SCHEDULER_TICK_MS: u64 = 60_000;
const TLS_MONITOR_MAX_CONCURRENCY: usize = 20;
const TLS_PROBE_INTERVAL: StdDuration = StdDuration::from_secs(6 * 60 * 60);
const BACKOFF_JITTER_PCT: f64 = 0.10;
const PRUNE_EVERY_TICKS: u64 = 3_600; // ~60 minutes at 1s scheduler tick

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

#[derive(Clone, Copy, Debug)]
struct RunnerParams {
    name: &'static str,
    scheduler_tick: StdDuration,
    max_concurrency: usize,
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
        run_loop_with_backoff(
            self.cache,
            self.probe,
            self.writer,
            self.metrics,
            RunnerParams {
                name: "monitor",
                scheduler_tick: self.runtime.scheduler_tick,
                max_concurrency: self.runtime.max_concurrency,
            },
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
        let probe_interval = self.runtime.probe_interval;
        run_loop(
            self.cache,
            self.probe,
            self.writer,
            self.metrics,
            RunnerParams {
                name: "tls",
                scheduler_tick: self.runtime.scheduler_tick,
                max_concurrency: self.runtime.max_concurrency,
            },
            move |check, now, last_run| {
                if check.url.scheme() != "https" {
                    return false;
                }
                let last = last_run.get(&check.id);
                match last {
                    Some(ts) => now.duration_since(*ts) >= probe_interval,
                    None => true,
                }
            },
            |probe, check| Box::pin(async move { probe.run_tls(&check).await }),
            |check, outcome| MonitorResultRow::from_tls_probe(check, outcome),
            |check, outcome| {
                info!(
                    check = %check.id,
                    status = ?outcome.status,
                    reason = %outcome.reason_code.as_str(),
                    days_left = ?outcome.tls_days_left,
                    "tls probe completed"
                );
            },
        )
        .await
    }
}

async fn run_loop_with_backoff<FProbe, FRow, FLog>(
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    params: RunnerParams,
    probe_fn: FProbe,
    build_row: FRow,
    log_probe: FLog,
) where
    FProbe: Fn(MonitorProbe, Arc<MonitorCheck>) -> ProbeFuture + Copy + Send + Sync + 'static,
    FRow: Fn(&MonitorCheck, &ProbeOutcome, &crate::monitor::BackoffSnapshot) -> MonitorResultRow
        + Copy
        + Send
        + Sync
        + 'static,
    FLog: Fn(&MonitorCheck, &ProbeOutcome) + Copy + Send + Sync + 'static,
{
    let mut ticker = interval(params.scheduler_tick);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
    let semaphore = Arc::new(Semaphore::new(params.max_concurrency));
    let mut last_run: HashMap<String, Instant> = HashMap::new();
    let mut next_wait: HashMap<String, StdDuration> = HashMap::new();
    let mut prune_counter: u64 = 0;
    let runner_name = params.name;
    let mut backoff = BackoffController::new(BackoffPolicy::default());

    info!(
        runner = params.name,
        tick_ms = params.scheduler_tick.as_millis(),
        max_concurrency = params.max_concurrency,
        "monitor runner with backoff started"
    );

    loop {
        ticker.tick().await;
        prune_counter = prune_counter.wrapping_add(1);

        let snapshot = cache.snapshot();
        if snapshot.is_empty() {
            continue;
        }

        let active_ids: HashSet<String> = snapshot.iter().map(|c| c.id.clone()).collect();
        if prune_counter % PRUNE_EVERY_TICKS == 0 {
            backoff.prune_inactive(&active_ids);
            last_run.retain(|id, _| active_ids.contains(id));
            next_wait.retain(|id, _| active_ids.contains(id));
        }

        let now = Instant::now();
        let mut set = JoinSet::new();

        for check in snapshot {
            let backoff_snapshot = backoff.current_snapshot(&check);
            let wait = next_wait
                .entry(check.id.clone())
                .or_insert_with(|| {
                    jitter_duration(backoff_snapshot.effective_interval, BACKOFF_JITTER_PCT)
                });
            let is_due = match last_run.get(&check.id) {
                Some(ts) => now.duration_since(*ts) >= *wait,
                None => true,
            };

            if !is_due {
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
                let outcome = probe_fn(probe.clone(), check_for_probe.clone()).await;
                let finished_at = Instant::now();

                if let Some(metrics) = &metrics {
                    metrics.record_monitor_probe(
                        &check_for_probe.id,
                        if outcome.success { "ok" } else { "fail" },
                        outcome.reason_code.as_str(),
                        "http",
                        outcome.latency,
                    );
                }

                log_probe(&check_for_probe, &outcome);

                Some((check_for_probe, outcome, finished_at))
            });
        }

        let mut collected: Vec<MonitorResultRow> = Vec::new();
        while let Some(res) = set.join_next().await {
            if let Ok(Some((check, outcome, finished_at))) = res {
                last_run.insert(check.id.clone(), finished_at);
                let backoff_snapshot = backoff.apply_outcome(&check, &outcome);
                next_wait.insert(
                    check.id.clone(),
                    jitter_duration(backoff_snapshot.effective_interval, BACKOFF_JITTER_PCT),
                );
                collected.push(build_row(&check, &outcome, &backoff_snapshot));
            }
        }

        if !collected.is_empty() {
            info!(
                runner = params.name,
                rows = collected.len(),
                "monitor batch ready for insert"
            );
            if let Err(err) = writer.enqueue_rows(collected) {
                warn!(runner = params.name, error = ?err, "Failed to enqueue monitor rows");
            }
        }
    }
}

async fn run_loop<FDue, FProbe, FRow, FLog>(
    cache: Arc<MonitorCache>,
    probe: MonitorProbe,
    writer: Arc<MonitorWriter>,
    metrics: Option<Arc<MetricsCollector>>,
    params: RunnerParams,
    is_due: FDue,
    probe_fn: FProbe,
    build_row: FRow,
    log_probe: FLog,
) where
    FDue: Fn(&MonitorCheck, Instant, &mut HashMap<String, Instant>) -> bool + Send + Sync + 'static,
    FProbe: Fn(MonitorProbe, Arc<MonitorCheck>) -> ProbeFuture + Copy + Send + Sync + 'static,
    FRow: Fn(&MonitorCheck, &ProbeOutcome) -> MonitorResultRow + Copy + Send + Sync + 'static,
    FLog: Fn(&MonitorCheck, &ProbeOutcome) + Copy + Send + Sync + 'static,
{
    let mut ticker = interval(params.scheduler_tick);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
    let semaphore = Arc::new(Semaphore::new(params.max_concurrency));
    let mut last_run: HashMap<String, Instant> = HashMap::new();
    let runner_name = params.name;

    info!(
        runner = params.name,
        tick_ms = params.scheduler_tick.as_millis(),
        max_concurrency = params.max_concurrency,
        "monitor runner started"
    );

    loop {
        ticker.tick().await;
        let snapshot = cache.snapshot();
        if snapshot.is_empty() {
            continue;
        }

        let now = Instant::now();
        let mut set = JoinSet::new();

        for check in snapshot {
            if !is_due(&check, now, &mut last_run) {
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
                let outcome = probe_fn(probe.clone(), check_for_probe).await;
                let finished_at = Instant::now();

                if let Some(metrics) = &metrics {
                    metrics.record_monitor_probe(
                        &check.id,
                        if outcome.success { "ok" } else { "fail" },
                        outcome.reason_code.as_str(),
                        "tls",
                        outcome.latency,
                    );
                }

                log_probe(&check, &outcome);

                Some((build_row(&check, &outcome), check.id.clone(), finished_at))
            });
        }

        let mut collected: Vec<MonitorResultRow> = Vec::new();
        while let Some(res) = set.join_next().await {
            if let Ok(Some((row, id, finished_at))) = res {
                last_run.insert(id, finished_at);
                collected.push(row);
            }
        }

        if !collected.is_empty() {
            info!(
                runner = params.name,
                rows = collected.len(),
                "monitor batch ready for insert"
            );
            if let Err(err) = writer.enqueue_rows(collected) {
                warn!(runner = params.name, error = ?err, "Failed to enqueue monitor rows");
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
