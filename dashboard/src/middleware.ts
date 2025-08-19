import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { UNLOCALIZED_ROUTES } from '@/constants/i18n';

export default createMiddleware(routing);

export const config = {
  matcher: [`/((?!api|_next|.*\\..*|${UNLOCALIZED_ROUTES.join('|')}).*)`],
};
