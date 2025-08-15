import { getUserSettingsAction } from '@/app/actions/userSettings';
import { SupportedLanguages } from '@/constants/supportedLanguages';
import { DEFAULT_LANGUAGE, getEffectiveLanguage } from '@/dictionaries/dictionaries';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale) {
    try {
      // Attempt to fetch user settings to determine the preferred language
      const result = await getUserSettingsAction();
      if (result.success) {
        locale = result.data.language || DEFAULT_LANGUAGE;
      } else {
        console.warn('Failed to fetch user settings, falling back to default language.');
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      locale = getEffectiveLanguage(locale ?? DEFAULT_LANGUAGE);
    }
  }

  return {
    locale: locale as SupportedLanguages,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
