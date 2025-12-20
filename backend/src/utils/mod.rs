//! Utilities for async task supervision.

use std::future::Future;
use std::time::Duration;

use tracing::{error, info};

/// Spawn an async task with automatic restart supervision.
///
/// If the task exits (which it shouldn't under normal conditions), it will be
/// restarted after an exponential backoff delay. This provides resilience
/// against unexpected panics or early returns in long-running background tasks.
///
/// # Arguments
/// * `name` - Readable name for logging
/// * `task_fn` - Async function that should run forever
///
/// # Example
/// ```ignore
/// spawn_supervised("cache_refresh", || async {
///     loop {
///         // ... do work ...
///         tokio::time::sleep(Duration::from_secs(30)).await;
///     }
/// });
/// ```
pub fn spawn_supervised<F, Fut>(name: &'static str, task_fn: F)
where
    F: Fn() -> Fut + Send + 'static,
    Fut: Future<Output = ()> + Send + 'static,
{
    tokio::spawn(async move {
        let mut restart_count: u32 = 0;
        const MAX_BACKOFF_SECS: u64 = 60;
        const BASE_BACKOFF_SECS: u64 = 1;

        loop {
            if restart_count > 0 {
                info!(task = name, restart_count, "Restarting supervised task");
            }

            task_fn().await;

            // If we get here, the task exited unexpectedly
            restart_count = restart_count.saturating_add(1);
            let backoff_secs = (BASE_BACKOFF_SECS << restart_count.min(6)).min(MAX_BACKOFF_SECS);

            error!(
                task = name,
                restart_count,
                backoff_secs,
                "Supervised task exited unexpectedly - restarting after backoff"
            );

            tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
        }
    });
}
