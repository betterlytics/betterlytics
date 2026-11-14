use std::collections::{HashMap, HashSet};
use std::marker::PhantomData;
use std::sync::Arc;
use std::time::Duration as StdDuration;
use std::{future::Future, pin::Pin};

use rand::Rng;
use tokio::sync::Semaphore;
use tokio::task::{self, JoinError, JoinSet};
use tokio::time::{Instant, MissedTickBehavior, interval};
use tracing::{debug, error, info, warn};

use crate::metrics::MetricsCollector;
use crate::monitor::{
    BackoffController, BackoffPolicy, BackoffSeeds, BackoffSnapshot, DomainRateLimiter,
    IncidentContext, IncidentOrchestrator, MonitorCache, MonitorCheck, MonitorProbe,
    MonitorResultRow, MonitorWriter, ProbeOutcome,
};
use crate::utils::{panic_message, spawn_supervised};

const BACKOFF_JITTER_RATIO: f64 = 0.10;

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
            probe_interval: StdDuration::from_secs(60 * 60),
        }
    }
}

type ProbeFuture = Pin<Box<dyn Future<Output = ProbeOutcome> + Send + 'static>>;

/// Strategy trait that defines variant-specific runner behavior
pub trait RunnerStrategy: Send + Sync + 'static {
    type Scheduler: ProbeScheduler;
    type RuntimeConfig: Clone + Copy + Send + Sync + 'static;

    fn name() -> &'static str;
    fn metrics_kind() -> &'static str;
    fn prune_every_ticks() -> u64;
    fn is_tls_runner() -> bool;

    fn scheduler_tick(runtime: &Self::RuntimeConfig) -> StdDuration;
    fn max_concurrency(runtime: &Self::RuntimeConfig) -> usize;
    fn create_scheduler(runtime: &Self::RuntimeConfig, seeds: BackoffSeeds) -> Self::Scheduler;
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

    fn create_scheduler(_runtime: &Self::RuntimeConfig, seeds: BackoffSeeds) -> Self::Scheduler {
        BackoffScheduler::new(seeds)
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

    fn create_scheduler(runtime: &Self::RuntimeConfig, _seeds: BackoffSeeds) -> Self::Scheduler {
        FixedIntervalScheduler::new(runtime.probe_interval)
    }

    fn probe_fn(probe: MonitorProbe, check: Arc<MonitorCheck>) -> ProbeFuture {
        Box::pin(async move { probe.run_tls(&check).await })
    }

    fn build_row(check: &MonitorCheck, outcome: &ProbeOutcome, _backoff: &BackoffSnapshot) -> MonitorResultRow {
        debug!(
            check = %check.id,
            status = ?outcome.status,
            reason = %outcome.reason_code.as_str(),
            tls_not_after = ?outcome.tls_not_after,
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
    incident_orchestrator: Arc<IncidentOrchestrator>,
    rate_limiter: Arc<DomainRateLimiter>,
    runtime: S::RuntimeConfig,
    backoff_seeds: BackoffSeeds,
    _marker: PhantomData<S>,
}

impl<S: RunnerStrategy> Runner<S> {
    pub fn new(
        cache: Arc<MonitorCache>,
        probe: MonitorProbe,
        writer: Arc<MonitorWriter>,
        metrics: Option<Arc<MetricsCollector>>,
        incident_orchestrator: Arc<IncidentOrchestrator>,
        rate_limiter: Arc<DomainRateLimiter>,
        runtime: S::RuntimeConfig,
    ) -> Self {
        Self {
            cache,
            probe,
            writer,
            metrics,
            incident_orchestrator,
            rate_limiter,
            runtime,
            backoff_seeds: BackoffSeeds::new(),
            _marker: PhantomData,
        }
    }

    pub fn with_backoff_seeds(mut self, seeds: BackoffSeeds) -> Self {
        self.backoff_seeds = seeds;
        self
    }

    pub fn spawn(self) {
        let Self {
            cache,
            probe,
            writer,
            metrics,
            incident_orchestrator,
            rate_limiter,
            runtime,
            backoff_seeds,
            ..
        } = self;
        // Seeds describe the state at startup only; a restarted loop starts cold.
        let mut backoff_seeds = Some(backoff_seeds);

        spawn_supervised(S::name(), move || {
            let config = RunLoopConfig {
                name: S::name(),
                scheduler_tick: S::scheduler_tick(&runtime),
                max_concurrency: S::max_concurrency(&runtime),
                prune_every_ticks: S::prune_every_ticks(),
                metrics_kind: S::metrics_kind(),
            };
            let scheduler = S::create_scheduler(&runtime, backoff_seeds.take().unwrap_or_default());

            run_loop::<S>(
                Arc::clone(&cache),
                probe.clone(),
                Arc::clone(&writer),
                metrics.clone(),
                incident_orchestrator.clone(),
                rate_limiter.clone(),
                config,
                scheduler,
            )
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

/// Trait for scheduling when monitors should be probed
pub trait ProbeScheduler: Send + Sync + 'static {
    fn check_due(
        &mut self,
        check: &MonitorCheck,
        now: Instant,
        last_run: &HashMap<String, Instant>,
    ) -> Option<BackoffSnapshot>;

    fn apply_outcome(
        &mut self,
        check: &MonitorCheck,
        outcome: &ProbeOutcome,
        finished_at: Instant,
    ) -> BackoffSnapshot;

    fn prune_inactive(&mut self, active_ids: &HashSet<String>);
}

pub struct BackoffScheduler {
    backoff: BackoffController,
    next_wait: HashMap<String, StdDuration>,
}

impl BackoffScheduler {
    pub fn new(seeds: BackoffSeeds) -> Self {
        Self {
            backoff: BackoffController::new(BackoffPolicy::default(), seeds),
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
        let saved = self.backoff.reset_if_saved(check);
        let snapshot = self.backoff.current_snapshot(check);

        // A saved check is probed right away instead of after the wait from its old level.
        if saved {
            self.next_wait.insert(
                check.id.clone(),
                jitter_duration(snapshot.effective_interval, BACKOFF_JITTER_RATIO),
            );
            return Some(snapshot);
        }

        let wait = self
            .next_wait
            .entry(check.id.clone())
            .or_insert_with(|| jitter_duration(snapshot.effective_interval, BACKOFF_JITTER_RATIO));

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
            jitter_duration(snapshot.effective_interval, BACKOFF_JITTER_RATIO),
        );
        snapshot
    }

    fn prune_inactive(&mut self, active_ids: &HashSet<String>) {
        self.backoff.prune_inactive(active_ids);
        self.next_wait.retain(|id, _| active_ids.contains(id));
    }
}

/// Scheduler with a fixed interval (used for TLS probes)
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
    incident_orchestrator: Arc<IncidentOrchestrator>,
    rate_limiter: Arc<DomainRateLimiter>,
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
            incident_orchestrator.prune_inactive(&active_ids).await;
            rate_limiter.prune_stale();
        }

        let now = Instant::now();
        let mut set = JoinSet::new();
        let mut probe_checks: HashMap<task::Id, String> = HashMap::new();

        for check in snapshot {
            if scheduler.check_due(&check, now, &last_run).is_none() {
                continue;
            }

            let domain = check.url.host_str().unwrap_or_default();
            if !rate_limiter.check(domain) {
                last_run.insert(check.id.clone(), now);
                debug!(
                    runner = runner_name,
                    check = %check.id,
                    domain = domain,
                    "probe skipped due to domain rate limit"
                );
                continue;
            }

            let probe = probe.clone();
            let metrics = metrics.clone();
            let semaphore = Arc::clone(&semaphore);
            let check_for_probe = check.clone();
            let check_id = check.id.clone();

            let task = set.spawn(async move {
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
            probe_checks.insert(task.id(), check_id);
        }

        if let Some(ref m) = metrics {
            m.set_monitor_active_probes(set.len());
        }

        let mut collected: Vec<MonitorResultRow> = Vec::new();
        while let Some(res) = set.join_next_with_id().await {
            if let Some((check, outcome, finished_at)) =
                settle_probe(runner_name, res, &probe_checks, &mut last_run)
            {
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

                let incident_ctx = IncidentContext::from_probe(
                    &check,
                    &outcome,
                    post_snapshot.consecutive_failures,
                );

                if is_tls_runner {
                    incident_orchestrator.process_tls_probe_outcome(&incident_ctx).await;
                } else {
                    incident_orchestrator.process_probe_outcome(&incident_ctx).await;
                }

                collected.push(S::build_row(&check, &outcome, &post_snapshot));
            }
        }

        if !collected.is_empty() {
            debug!(
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

/// Unwraps a finished probe task. A probe that panicked is logged and marked as run,
/// so it waits its normal interval instead of being retried on every tick.
fn settle_probe<T>(
    runner_name: &'static str,
    res: Result<(task::Id, Option<T>), JoinError>,
    probe_checks: &HashMap<task::Id, String>,
    last_run: &mut HashMap<String, Instant>,
) -> Option<T> {
    match res {
        Ok((_, result)) => result,
        Err(err) => {
            let check_id = probe_checks.get(&err.id());
            if err.is_panic() {
                let panic = panic_message(err.into_panic().as_ref());
                error!(
                    runner = runner_name,
                    check = check_id.map(String::as_str).unwrap_or("unknown"),
                    panic = %panic,
                    "probe panicked; skipping until its next interval"
                );
            }
            if let Some(check_id) = check_id {
                last_run.insert(check_id.clone(), Instant::now());
            }
            None
        }
    }
}

fn jitter_duration(base: StdDuration, jitter_ratio: f64) -> StdDuration {
    let mut rng = rand::thread_rng();
    jitter_duration_with_rng(base, jitter_ratio, &mut rng)
}

fn jitter_duration_with_rng<R: Rng + ?Sized>(
    base: StdDuration,
    jitter_ratio: f64,
    rng: &mut R,
) -> StdDuration {
    if jitter_ratio <= 0.0 {
        return base;
    }

    let ratio = jitter_ratio.clamp(0.0, 1.0);
    let base_ms: i128 = base.as_millis().max(1) as i128;
    let jitter_span: i128 = ((base_ms as f64) * ratio).round() as i128;

    if jitter_span == 0 {
        return base;
    }

    let delta: i128 = rng.gen_range(-jitter_span..=jitter_span);
    let adjusted_ms = (base_ms + delta).max(1);

    StdDuration::from_millis(adjusted_ms as u64)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::monitor::{AlertConfig, BackoffSeed, HttpMethod, ReasonCode};
    use chrono::{DateTime, Utc};

    fn check(updated_at: DateTime<Utc>) -> MonitorCheck {
        MonitorCheck {
            id: "check-1".to_string(),
            dashboard_id: "dash-1".to_string(),
            site_id: "site-1".to_string(),
            name: None,
            url: url::Url::parse("https://example.com").unwrap(),
            interval: StdDuration::from_secs(300),
            timeout: StdDuration::from_secs(5),
            updated_at,
            http_method: HttpMethod::Head,
            request_headers: Vec::new(),
            accepted_status_codes: Vec::new(),
            expected_keyword: None,
            check_ssl_errors: false,
            alert: AlertConfig::default(),
        }
    }

    /// A scheduler restored at level 3 (40m) for a 5m check last saved an hour ago.
    fn restored_scheduler() -> (BackoffScheduler, MonitorCheck) {
        let check = check(Utc::now() - chrono::Duration::hours(1));
        let seed = BackoffSeed {
            ts: Utc::now() - chrono::Duration::minutes(10),
            backoff_level: 3,
        };
        let scheduler = BackoffScheduler::new(HashMap::from([(check.id.clone(), seed)]));
        (scheduler, check)
    }

    fn failure() -> ProbeOutcome {
        ProbeOutcome::failure(StdDuration::from_millis(50), Some(503), ReasonCode::Http5xx)
    }

    #[test]
    fn restored_check_runs_at_startup_then_waits_for_its_level() {
        let (mut scheduler, check) = restored_scheduler();
        let now = Instant::now();
        let mut last_run = HashMap::new();

        let snapshot = scheduler.check_due(&check, now, &last_run).expect("due at startup");
        assert_eq!(snapshot.backoff_level, 3);

        let snapshot = scheduler.apply_outcome(&check, &failure(), now);
        assert_eq!(snapshot.backoff_level, 3);
        last_run.insert(check.id.clone(), now);

        // Well past the 5m base interval, but short of the restored 40m.
        let later = now + StdDuration::from_secs(20 * 60);
        assert!(scheduler.check_due(&check, later, &last_run).is_none());
    }

    #[test]
    fn saved_check_is_due_right_away_at_level_zero() {
        let (mut scheduler, check) = restored_scheduler();
        let now = Instant::now();
        let last_run = HashMap::from([(check.id.clone(), now)]);
        assert!(scheduler.check_due(&check, now, &last_run).is_none());

        let saved = MonitorCheck {
            updated_at: Utc::now(),
            ..check
        };
        let snapshot = scheduler.check_due(&saved, now, &last_run).expect("due after save");
        assert_eq!(snapshot.backoff_level, 0);
        assert_eq!(snapshot.effective_interval, saved.interval);

        // Only the save makes it due early; afterwards it waits for its base interval.
        assert!(scheduler.check_due(&saved, now, &last_run).is_none());
    }

    #[tokio::test]
    async fn panicking_probe_waits_its_interval_and_spares_other_checks() {
        let mut scheduler = BackoffScheduler::new(BackoffSeeds::new());
        let panicking = check(Utc::now());
        let healthy = MonitorCheck {
            id: "check-2".to_string(),
            ..check(Utc::now())
        };
        let now = Instant::now();
        let mut last_run = HashMap::new();
        assert!(scheduler.check_due(&panicking, now, &last_run).is_some());

        let mut set = JoinSet::new();
        let mut probe_checks = HashMap::new();
        let task = set.spawn(async { panic!("probe bug") });
        probe_checks.insert(task.id(), panicking.id.clone());
        let task = set.spawn(async { Some("ok") });
        probe_checks.insert(task.id(), healthy.id.clone());

        let mut results = Vec::new();
        while let Some(res) = set.join_next_with_id().await {
            results.extend(settle_probe::<&str>("test", res, &probe_checks, &mut last_run));
        }
        assert_eq!(results, vec!["ok"]);

        // Not retried on the next ticks, only once its interval (plus jitter) has passed.
        let next_tick = now + StdDuration::from_secs(1);
        assert!(scheduler.check_due(&panicking, next_tick, &last_run).is_none());
        let after_interval =
            now + panicking.interval.mul_f64(1.0 + BACKOFF_JITTER_RATIO) + StdDuration::from_secs(1);
        assert!(scheduler.check_due(&panicking, after_interval, &last_run).is_some());
    }
}
