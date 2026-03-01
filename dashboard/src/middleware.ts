import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const localeRouteSegments: string[] = JSON.parse(process.env.LOCALE_ROUTE_SEGMENTS!);
const locales = routing.locales as readonly string[];

export function middleware(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split('/')[1];

  if (firstSegment && !localeRouteSegments.includes(firstSegment) && !locales.includes(firstSegment)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*|dashboard|dashboards|billing).*)'],
};
