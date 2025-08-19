import { getUserSettingsAction } from '@/app/actions/userSettings';
import { SupportedLanguages } from '@/constants/i18n';
import { env } from '@/lib/env';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale) {
    try {
      const result = await getUserSettingsAction();
      if (result.success) {
        locale = result.data.language;
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      locale ??= env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
    }
  }

  return {
    locale: locale as SupportedLanguages,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
