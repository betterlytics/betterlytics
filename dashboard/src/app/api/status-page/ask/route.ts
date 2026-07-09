import { NextRequest, NextResponse } from 'next/server';
import { resolveAskStatus } from './askGuard';

// Called by Caddy before on-demand TLS issuance; non-200 aborts the handshake. Caddy hits this
// for every new SNI, so the guard (negative cache + global lookup ceiling) keeps hostname
// enumeration off the DB — see askGuard.ts.
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  const status = await resolveAskStatus(domain ?? '');
  return new NextResponse(null, { status });
}
