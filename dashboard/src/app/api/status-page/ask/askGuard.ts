import 'server-only';

import { getTlsAuthorization, normalizeHostname } from '@/services/analytics/statusPageDomain.service';

// Hardening for the Caddy on-demand-TLS `ask` endpoint. Caddy calls it during the TLS
// handshake for every new SNI, so anyone enumerating hostnames turns into a flood of DB
// lookups. Two in-memory guards keep that flood off Postgres:
//   1. a short-lived negative cache, so repeated probes for the same unknown host never
//      re-hit the DB (the cert path caches authorized hosts in Caddy, so only misses recur);
//   2. a global ceiling on DB-backed lookups per window, bounding distinct-host enumeration.
// Both are per-process and reset on restart — deliberately cheap. The durable defenses live at
// the connection layer (see caddy/ and the ops runbook), which is the only thing that can cap
// how fast an attacker triggers `ask` in the first place.

const NEGATIVE_CACHE_TTL_MS = 30_000;
const NEGATIVE_CACHE_MAX_ENTRIES = 10_000;

const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX_LOOKUPS = 600;

const SWEEP_INTERVAL_MS = 5 * 60_000;

// normalized hostname -> epoch ms after which the cached "unauthorized" result expires
const negativeCache = new Map<string, number>();
// timestamps of DB-backed lookups still inside the current global window
const lookupTimestamps: number[] = [];

function pruneWindow(now: number): void {
  const cutoff = now - GLOBAL_WINDOW_MS;
  while (lookupTimestamps.length > 0 && lookupTimestamps[0]! <= cutoff) {
    lookupTimestamps.shift();
  }
}

/** Records a DB-backed lookup; returns false once the per-window ceiling is reached. */
function withinGlobalLimit(now: number): boolean {
  pruneWindow(now);
  if (lookupTimestamps.length >= GLOBAL_MAX_LOOKUPS) return false;
  lookupTimestamps.push(now);
  return true;
}

function rememberUnauthorized(domain: string, now: number): void {
  if (negativeCache.size >= NEGATIVE_CACHE_MAX_ENTRIES) {
    const oldest = negativeCache.keys().next().value;
    if (oldest !== undefined) negativeCache.delete(oldest);
  }
  negativeCache.set(domain, now + NEGATIVE_CACHE_TTL_MS);
}

/**
 * Resolve the HTTP status Caddy's `ask` endpoint should return for a hostname:
 *   400 missing/empty · 200 authorized · 403 own namespace · 404 not authorized ·
 *   429 when the global lookup ceiling is hit. Caddy treats any non-2xx as "deny" and retries
 *   on a later handshake, so a transient 429/404 during a flood is self-healing.
 */
export async function resolveAskStatus(rawDomain: string): Promise<number> {
  const domain = normalizeHostname(rawDomain);
  if (!domain) return 400;

  const now = Date.now();

  const cachedUntil = negativeCache.get(domain);
  if (cachedUntil !== undefined) {
    if (cachedUntil > now) return 404;
    negativeCache.delete(domain);
  }

  if (!withinGlobalLimit(now)) return 429;

  const authorization = await getTlsAuthorization(domain);
  // Only the DB-backed miss is worth caching; `forbidden` (own namespace) is already DB-free.
  if (authorization === 'unauthorized') rememberUnauthorized(domain, now);

  return authorization === 'authorized' ? 200 : authorization === 'forbidden' ? 403 : 404;
}

setInterval(() => {
  const now = Date.now();
  for (const [domain, expiry] of negativeCache) {
    if (expiry <= now) negativeCache.delete(domain);
  }
  pruneWindow(now);
}, SWEEP_INTERVAL_MS).unref();
