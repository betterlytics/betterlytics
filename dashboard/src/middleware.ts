import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export const middleware = createMiddleware(routing);

export const config = {
  matcher: [
    '/',
    '/(en|da|it|nb)/:path*',
    '/(about|accept-invite|changelog|contact|demo|dpa|features|forgot-password|pricing|privacy|reset-password|subprocessors|terms|verify-email|vs|signin|signup|onboarding|share|email-preview)/:path*',
  ],
};
