import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/constants/i18n';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE_NAME } from '@/constants/cookies';
import { cookies } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale) {
    try {
      const cookieStore = await cookies();
      locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    } catch {
      // Cookies may not be available in all contexts (e.g., during build)
    }
  }

  if (!SUPPORTED_LANGUAGES.includes(locale as SupportedLanguages)) {
    locale = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'en';
  }

  return {
    locale: locale as SupportedLanguages,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
