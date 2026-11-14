use std::any::Any;
use std::future::Future;
use std::time::Duration;

use tracing::{error, info};

/// Spawn an async task with automatic restart supervision.
///
/// Each attempt runs as its own Tokio task, so a panic ends only that attempt.
/// If the task panics or exits (which it shouldn't under normal conditions), it
/// is restarted after an exponential backoff delay.
///
/// # Arguments
/// * `name` - Readable name for logging
/// * `task_fn` - Async function that should run forever, called once per attempt
///
/// # Example
/// ```ignore
/// spawn_supervised("cache_refresh", || async {
///     loop {
///         // ... do work ...
///     }
/// });
/// ```
pub fn spawn_supervised<F, Fut>(name: &'static str, mut task_fn: F)
where
    F: FnMut() -> Fut + Send + 'static,
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

            let result = tokio::spawn(task_fn()).await;

            let backoff_secs = (BASE_BACKOFF_SECS << restart_count.min(6)).min(MAX_BACKOFF_SECS);
            restart_count = restart_count.saturating_add(1);

            match result {
                Err(err) if err.is_panic() => {
                    let panic = panic_message(err.into_panic().as_ref());
                    error!(
                        task = name,
                        panic = %panic,
                        restart_count,
                        backoff_secs,
                        "Supervised task panicked - restarting after backoff"
                    );
                }
                _ => {
                    error!(
                        task = name,
                        restart_count,
                        backoff_secs,
                        "Supervised task exited unexpectedly - restarting after backoff"
                    );
                }
            }

            tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
        }
    });
}

/// Readable message from a panic payload, as passed to `panic!`.
pub fn panic_message(payload: &(dyn Any + Send)) -> String {
    if let Some(message) = payload.downcast_ref::<&'static str>() {
        (*message).to_string()
    } else if let Some(message) = payload.downcast_ref::<String>() {
        message.clone()
    } else {
        "non-string panic payload".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicU32, Ordering};
    use tokio::sync::mpsc;

    #[tokio::test(start_paused = true)]
    async fn panicking_task_is_restarted_after_backoff() {
        let attempts = Arc::new(AtomicU32::new(0));
        let (started_tx, mut started_rx) = mpsc::unbounded_channel();

        let counter = Arc::clone(&attempts);
        spawn_supervised("test_panicking_task", move || {
            let attempt = counter.fetch_add(1, Ordering::SeqCst) + 1;
            let started_tx = started_tx.clone();
            async move {
                started_tx.send((attempt, tokio::time::Instant::now())).unwrap();
                if attempt == 1 {
                    panic!("boom");
                }
                std::future::pending::<()>().await;
            }
        });

        let (first, first_at) = started_rx.recv().await.unwrap();
        let (second, second_at) = started_rx.recv().await.unwrap();
        assert_eq!((first, second), (1, 2));
        assert_eq!(second_at - first_at, Duration::from_secs(1));

        // The second attempt keeps running, so there is no further restart.
        tokio::time::sleep(Duration::from_secs(600)).await;
        assert_eq!(attempts.load(Ordering::SeqCst), 2);
    }

    #[test]
    fn panic_message_reads_str_and_string_payloads() {
        assert_eq!(panic_message(&"static"), "static");
        assert_eq!(panic_message(&String::from("owned")), "owned");
        assert_eq!(panic_message(&42_u32), "non-string panic payload");
    }
}
