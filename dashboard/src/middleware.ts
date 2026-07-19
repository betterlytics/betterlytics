import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Status paths carry a hostname from Caddy's rewrite, as sent by the client. Canonicalize
  // (lowercase, strip trailing dots) before routing so case variants of the same host share one
  // ISR cache entry. Safe to lowercase the whole path: slugs and custom domains are stored
  // lowercase, and the other path segments already are.
  if (pathname.startsWith('/status/')) {
    const normalized = pathname.toLowerCase().replace(/\.+$/, '');
    if (normalized !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = normalized;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (request.method === 'POST' && request.url.includes('[locale]')) {
    console.error('[next-intl loop detected]', request.url);
    return new Response('Bad request', { status: 400 });
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*|dashboard|dashboards|billing|admin|status).*)', '/status/:path*'],
};
