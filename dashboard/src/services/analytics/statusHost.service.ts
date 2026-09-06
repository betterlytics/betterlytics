import 'server-only';

import { createSlidingWindowLimiter } from '@/lib/rate-limit';
import { ExpiringSet } from '@/lib/expiring-set';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { findStatusPageByCustomDomain } from '@/repositories/postgres/statusPage.repository';
import type { StatusHostClassification } from '@/lib/status-host-routing';

export type { StatusHostClassification };

// Per-process caches in the same spirit as app/api/status-page/ask/askGuard.ts: reset on restart,
// deliberately cheap. They keep host classification off Postgres for all but cold hosts.
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

const checkGlobalLookupLimit = createSlidingWindowLimiter(
  STATUS_HOST_LIMITS.globalWindowMs,
  STATUS_HOST_LIMITS.globalMaxLookups,
);
const GLOBAL_KEY = 'global';

// A known status host is retained for a day and considered fresh for a minute; a refresh re-adds
// it at the tail, so live domains survive the cap and abandoned ones age out.
const retainedHosts = new ExpiringSet(STATUS_HOST_LIMITS.retainMs, STATUS_HOST_LIMITS.statusMaxEntries);
const freshHosts = new ExpiringSet(STATUS_HOST_LIMITS.freshMs, STATUS_HOST_LIMITS.statusMaxEntries);
const unknownHosts = new ExpiringSet(STATUS_HOST_LIMITS.unknownTtlMs, STATUS_HOST_LIMITS.unknownMaxEntries);
// One DB query per host at a time; a caller that stops waiting leaves it running, so retries never add work.
const inflight = new Map<string, Promise<StatusHostClassification>>();

/**
 * Classifies a hostname for middleware routing. `status` means a status page row claims this
 * custom domain (published or not; the page decides what to render). A known host is answered from
 * cache and refreshed in the background, so a slow database never delays it. A cold host waits for
 * its lookup at most STATUS_HOST_LIMITS.lookupDeadlineMs and is `unavailable` beyond that.
 */
export async function classifyStatusHost(domain: string): Promise<StatusHostClassification> {
  if (!isFeatureEnabled('enablePublicStatusPages')) return 'unknown';

  if (retainedHosts.has(domain)) {
    if (!freshHosts.has(domain)) void refresh(domain);
    return 'status';
  }
  if (unknownHosts.has(domain)) return 'unknown';

  return Promise.race([
    refresh(domain),
    resolveAfter(STATUS_HOST_LIMITS.lookupDeadlineMs, 'unavailable' as const),
  ]);
}

function refresh(domain: string): Promise<StatusHostClassification> {
  const pending = inflight.get(domain);
  if (pending) return pending;

  // Stale status beats refusing; refusing beats serving the app on a status domain.
  const fallback: StatusHostClassification = retainedHosts.has(domain) ? 'status' : 'unavailable';
  if (!checkGlobalLookupLimit(GLOBAL_KEY).allowed) return Promise.resolve(fallback);

  const lookup = findStatusPageByCustomDomain(domain)
    .then((page): StatusHostClassification => {
      if (page) {
        retainedHosts.add(domain);
        freshHosts.add(domain);
        return 'status';
      }
      retainedHosts.delete(domain);
      freshHosts.delete(domain);
      unknownHosts.add(domain);
      return 'unknown';
    })
    .catch(() => fallback)
    .finally(() => inflight.delete(domain));
  inflight.set(domain, lookup);
  return lookup;
}

function resolveAfter<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms).unref();
  });
}
