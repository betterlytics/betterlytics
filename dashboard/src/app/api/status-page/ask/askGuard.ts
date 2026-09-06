import 'server-only';

import { createSlidingWindowLimiter } from '@/lib/rate-limit';
import { ExpiringSet } from '@/lib/expiring-set';
import { normalizeHostname } from '@/lib/status-host-routing';
import { getTlsAuthorization } from '@/services/analytics/statusPageDomain.service';

// Hardening for the Caddy on-demand-TLS `ask` endpoint. Caddy calls it during the TLS
// handshake for every new SNI, so anyone enumerating hostnames turns into a flood of DB
// lookups. Two in-memory guards keep that flood off Postgres:
//   1. a short-lived negative cache, so repeated probes for the same unknown host never
//      re-hit the DB (the cert path caches authorized hosts in Caddy, so only misses recur);
//   2. a global ceiling on DB-backed lookups per window, bounding distinct-host enumeration.
// Both are per-process and reset on restart — deliberately cheap. They only bound the DB cost of
// asks that reach this code; the endpoint itself is gated by a shared secret (see route.ts) so an
// unauthenticated caller never spends the budget in the first place.

const NEGATIVE_CACHE_TTL_MS = 30_000;
const NEGATIVE_CACHE_MAX_ENTRIES = 10_000;

const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX_LOOKUPS = 600;

// The ceiling is global, not per-caller, so every check shares one key.
const checkGlobalLookupLimit = createSlidingWindowLimiter(GLOBAL_WINDOW_MS, GLOBAL_MAX_LOOKUPS);
const GLOBAL_KEY = 'global';

const negativeCache = new ExpiringSet(NEGATIVE_CACHE_TTL_MS, NEGATIVE_CACHE_MAX_ENTRIES);

/**
 * Resolve the HTTP status Caddy's `ask` endpoint should return for a hostname:
 *   400 missing/empty · 200 authorized · 403 own namespace · 404 not authorized ·
 *   429 when the global lookup ceiling is hit. Caddy treats any non-2xx as "deny" and retries
 *   on a later handshake, so a transient 429/404 during a flood is self-healing.
 */
export async function resolveAskStatus(rawDomain: string): Promise<number> {
  const domain = normalizeHostname(rawDomain);
  if (!domain) return 400;

  if (negativeCache.has(domain)) return 404;

  if (!checkGlobalLookupLimit(GLOBAL_KEY).allowed) return 429;

  const authorization = await getTlsAuthorization(domain);
  // Only the DB-backed miss is worth caching; `forbidden` (own namespace) is already DB-free.
  if (authorization === 'unauthorized') negativeCache.add(domain);

  return authorization === 'authorized' ? 200 : authorization === 'forbidden' ? 403 : 404;
}
