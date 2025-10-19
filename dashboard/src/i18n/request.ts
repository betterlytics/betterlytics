import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/constants/i18n';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale) {
    try {
      const session = await getServerSession(authOptions);

      if (session?.user.settings?.language) {
        locale = session.user.settings.language;
      }
    } catch (error) {
      console.error('Error fetching user settings from session:', error);
    }
  }

  if (SUPPORTED_LANGUAGES.includes(locale as SupportedLanguages) === false) {
    locale = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
  }

  return {
    locale: locale as SupportedLanguages,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
