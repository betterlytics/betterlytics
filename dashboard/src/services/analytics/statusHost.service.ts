import 'server-only';

import { createSlidingWindowLimiter } from '@/lib/rate-limit';
import { ExpiringSet } from '@/lib/expiring-set';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findStatusPageByCustomDomain, statusPageSlugExists } from '@/repositories/postgres/statusPage.repository';
import type { StatusHostClassification } from '@/lib/status-host-routing';

export type { StatusHostClassification };

// Per-process caches in the same spirit as app/api/status-page/ask/askGuard.ts: reset on restart,
// deliberately cheap. They keep host and slug classification off Postgres for all but cold keys.
export const STATUS_HOST_LIMITS = {
  freshMs: 60_000,
  retainMs: 24 * 60 * 60 * 1000,
  statusMaxEntries: 10_000,
  unknownTtlMs: 30_000,
  unknownMaxEntries: 10_000,
  lookupDeadlineMs: 2_000,
  globalWindowMs: 60_000,
  globalMaxLookups: 600,
} as const;

/**
 * Per-process classifier over one kind of status page key (custom domain or slug). `status` means a
 * status page row claims the key (published or not; the page decides what to render). A known key
 * is answered from cache and refreshed in the background, so a slow database never delays it. A
 * cold key waits for its lookup at most STATUS_HOST_LIMITS.lookupDeadlineMs and is `unavailable`
 * beyond that.
 */
function createStatusKeyClassifier(exists: (key: string) => Promise<boolean>) {
  const checkGlobalLookupLimit = createSlidingWindowLimiter(
    STATUS_HOST_LIMITS.globalWindowMs,
    STATUS_HOST_LIMITS.globalMaxLookups,
  );
  const GLOBAL_KEY = 'global';

  // A known key is retained for a day and considered fresh for a minute; a refresh re-adds it at
  // the tail, so live keys survive the cap and abandoned ones age out.
  const retainedKeys = new ExpiringSet(STATUS_HOST_LIMITS.retainMs, STATUS_HOST_LIMITS.statusMaxEntries);
  const freshKeys = new ExpiringSet(STATUS_HOST_LIMITS.freshMs, STATUS_HOST_LIMITS.statusMaxEntries);
  const unknownKeys = new ExpiringSet(STATUS_HOST_LIMITS.unknownTtlMs, STATUS_HOST_LIMITS.unknownMaxEntries);
  // One DB query per key at a time; a caller that stops waiting leaves it running, so retries never add work.
  const inflight = new Map<string, Promise<StatusHostClassification>>();

  function refresh(key: string): Promise<StatusHostClassification> {
    const pending = inflight.get(key);
    if (pending) return pending;

    // Stale status beats refusing; refusing beats serving the app on a status domain.
    const fallback: StatusHostClassification = retainedKeys.has(key) ? 'status' : 'unavailable';
    if (!checkGlobalLookupLimit(GLOBAL_KEY).allowed) return Promise.resolve(fallback);

    const lookup = exists(key)
      .then((found): StatusHostClassification => {
        if (found) {
          retainedKeys.add(key);
          freshKeys.add(key);
          return 'status';
        }
        retainedKeys.delete(key);
        freshKeys.delete(key);
        unknownKeys.add(key);
        return 'unknown';
      })
      .catch(() => fallback)
      .finally(() => inflight.delete(key));
    inflight.set(key, lookup);
    return lookup;
  }

  return async function classify(key: string): Promise<StatusHostClassification> {
    if (!isFeatureEnabled('enablePublicStatusPages')) return 'unknown';

    if (retainedKeys.has(key)) {
      if (!freshKeys.has(key)) void refresh(key);
      return 'status';
    }
    if (unknownKeys.has(key)) return 'unknown';

    return Promise.race([refresh(key), resolveAfter(STATUS_HOST_LIMITS.lookupDeadlineMs, 'unavailable' as const)]);
  };
}

/** Classifies a hostname for middleware routing: does a status page claim it as its custom domain? */
export const classifyStatusHost = createStatusKeyClassifier(async (domain) =>
  Boolean(await findStatusPageByCustomDomain(domain)),
);

/** Classifies a `/status/{slug}` slug, so middleware can turn unknown slugs away before they render. */
export const classifyStatusSlug = createStatusKeyClassifier((slug) => statusPageSlugExists(slug));

function resolveAfter<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms).unref();
  });
}
