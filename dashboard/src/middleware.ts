import createMiddleware from 'next-intl/middleware';
import { isSignedInPath, isUnlocalizedPath, routing } from '@/i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import {
  decideStatusHostRoute,
  isOwnHost,
  normalizeHostname,
  ownHostsFrom,
  statusPageNotFoundPath,
  statusPagePathTarget,
} from '@/lib/status-host-routing';
import { classifyStatusHost, classifyStatusSlug } from '@/services/analytics/statusHost.service';
import { withSigninReturnTo } from '@/lib/auth/signin-redirect';

const intlMiddleware = createMiddleware(routing);
const OWN_HOSTS = ownHostsFrom(
  env.PUBLIC_BASE_URL,
  sharedEmailEnv.isCloud ? env.STATUS_PAGE_DOMAIN : '',
  sharedEmailEnv.isCloud,
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = normalizeHostname(request.headers.get('host') ?? '');

  if (host && !isOwnHost(host, OWN_HOSTS)) {
    const route = decideStatusHostRoute(await classifyStatusHost(host), host, pathname, sharedEmailEnv.isCloud);
    if (route.kind === 'unavailable') {
      return new NextResponse(null, { status: 503, headers: { 'Retry-After': '10' } });
    }
    if (route.kind === 'notFound') return new NextResponse(null, { status: 404 });
    if (route.kind === 'rewrite') {
      const url = request.nextUrl.clone();
      url.pathname = route.pathname;
      return NextResponse.rewrite(url);
    }
  }

  if (pathname.startsWith('/_next/')) return NextResponse.next();

  // Status paths carry a hostname as sent by the client. Canonicalize (lowercase, strip trailing
  // dots) before routing so case variants of the same host share one ISR cache entry. Safe to
  // lowercase the whole path: slugs and custom domains are stored lowercase, and the other path
  // segments already are.
  if (pathname.startsWith('/status/')) {
    let normalized = pathname.toLowerCase().replace(/\.+$/, '');
    const target = statusPagePathTarget(normalized);
    if (target) {
      const classify = target.kind === 'domain' ? classifyStatusHost : classifyStatusSlug;
      const classification = await classify(target.key);
      if (classification === 'unavailable') {
        return new NextResponse(null, { status: 503, headers: { 'Retry-After': '10' } });
      }
      if (classification === 'unknown') normalized = statusPageNotFoundPath(target.kind);
    }
    if (normalized !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = normalized;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (isSignedInPath(pathname)) {
    return NextResponse.next({ request: { headers: withSigninReturnTo(request) } });
  }

  // Was the matcher's negative lookahead; now applied after the host check so status hosts can 404 these.
  if (isUnlocalizedPath(pathname) || pathname.includes('.')) return NextResponse.next();

  if (request.method === 'POST' && request.url.includes('[locale]')) {
    console.error('[next-intl loop detected]', request.url);
    return new Response('Bad request', { status: 400 });
  }

  return intlMiddleware(request);
}

export const config = {
  runtime: 'nodejs',
  // Only Next's static assets skip the host check; every other path, dotted or not, is classified first.
  matcher: ['/((?!_next/static/).*)'],
};
