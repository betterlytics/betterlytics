import { SupportedLanguages } from '@/constants/i18n';
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { LOCALE_COOKIE_NAME } from '@/constants/cookies';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';
import { getCachedSession } from '@/auth/api-auth';
import { getCachedUserSettings } from '@/services/account/userSettings.service';

export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale;

  // Routes without a [locale] segment (the signed-in app). The saved user setting is
  // authoritative so a language change follows the user across devices; the cookie
  // covers signed-out visitors.
  if (!requested) {
    try {
      const session = await getCachedSession();
      if (session?.user) {
        requested = (await getCachedUserSettings(session.user.id)).language;
      }
    } catch {
      // Session may not be resolvable in all contexts (e.g., during build)
    }
  }

  if (!requested) {
    try {
      const cookieStore = await cookies();
      requested = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    } catch {
      // Cookies may not be available in all contexts (e.g., during build)
    }
  }

  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale: locale as SupportedLanguages,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
