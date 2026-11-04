const UNLOAD_GRACE_MS = 2000;

// Has no message, so callers fall back to their generic error.
export class RedirectAbandonedError extends Error {}

// When a server action redirects across root layouts, as it does to /signin, Next resolves it with undefined
// and starts a full page load. Stay pending until the page unloads, so callers don't take that for a result.
// Choosing Stay on the browser's leave prompt cancels that load, so reject if the page outlives the prompt.
export async function holdForRedirect<T>(action: Promise<T>): Promise<T> {
  const result = await action;
  if (result !== undefined) return result;

  return new Promise<T>((_, reject) => {
    const abandon = () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      // Next's router stays parked on the cancelled load: it posts later actions to /signin, and ignores a repeat
      // of the same redirect. Its bfcache restore handler is the only thing that clears that state.
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      reject(new RedirectAbandonedError());
    };

    // A beforeunload normally follows straight away. Without one no load has started, so don't wait forever.
    let timer = setTimeout(abandon, UNLOAD_GRACE_MS);

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      clearTimeout(timer);
      // Timers don't run while the prompt is open, so this one fires once it closes. Without a prompt the load
      // is on its way, however slow. Choosing Leave also waits on the network, hence the grace period.
      timer = setTimeout(() => {
        if (event.defaultPrevented) timer = setTimeout(abandon, UNLOAD_GRACE_MS);
      });
    };
    window.addEventListener('beforeunload', onBeforeUnload);
  });
}

export function retryUnlessRedirectAbandoned(failureCount: number, error: Error) {
  return failureCount < 1 && !(error instanceof RedirectAbandonedError);
}
