import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { env } from '@/lib/env';
import { resolveAskStatus } from './askGuard';

// Called by Caddy before on-demand TLS issuance; non-200 aborts the handshake. Caddy hits this
// for every new SNI, so the guard (negative cache + global lookup ceiling) keeps hostname
// enumeration off the DB — see askGuard.ts.
//
// The endpoint is reachable on the public app origin (middleware excludes /api), so it is
// authenticated with a shared secret that Caddy carries in the `token` query param (Caddy's
// on-demand `ask` cannot set custom headers, but preserves existing query params — see
// caddy/Caddyfile). Unauthenticated callers are rejected before any DB lookup or guard-budget
// spend, closing the enumeration-oracle and lookup-exhaustion vectors. When STATUS_PAGE_ASK_SECRET
// is unset (local dev), the check is skipped.
function isCaddyAuthorized(request: NextRequest): boolean {
  const expected = env.STATUS_PAGE_ASK_SECRET;
  if (!expected) return true;

  const provided = request.nextUrl.searchParams.get('token') ?? '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  return expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
}

export async function GET(request: NextRequest) {
  // Deny as 404 (not 401/403) so the token is not itself an oracle; Caddy treats any non-2xx as deny.
  if (!isCaddyAuthorized(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const domain = request.nextUrl.searchParams.get('domain');
  const status = await resolveAskStatus(domain ?? '');
  return new NextResponse(null, { status });
}
