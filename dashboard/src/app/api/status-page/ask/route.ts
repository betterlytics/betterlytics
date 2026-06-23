import { NextRequest, NextResponse } from 'next/server';
import { getTlsAuthorization } from '@/services/analytics/statusPageDomain.service';

// Called by Caddy before on-demand TLS issuance; non-200 aborts the handshake.
// Only reachable over the internal Docker network.
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) {
    return new NextResponse(null, { status: 400 });
  }

  const authorization = await getTlsAuthorization(domain);
  const status = authorization === 'authorized' ? 200 : authorization === 'forbidden' ? 403 : 404;
  return new NextResponse(null, { status });
}
