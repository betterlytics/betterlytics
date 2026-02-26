import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  if (request.method === 'POST' && request.url.includes('[locale]')) {
    console.error('[next-intl loop detected]', request.url);
    return new Response('Bad request', { status: 400 });
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*|dashboard|dashboards|billing).*)'],
};
