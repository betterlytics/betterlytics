import { SupportedLanguages } from '@/constants/i18n';
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { LOCALE_COOKIE_NAME } from '@/constants/cookies';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale;

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
