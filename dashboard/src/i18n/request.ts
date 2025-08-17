import { getUserSettingsAction } from '@/app/actions/userSettings';
import { DEFAULT_LANGUAGE, getEffectiveLanguage } from '@/dictionaries/dictionaries';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const preferredLanguage = DEFAULT_LANGUAGE;
  const effectiveLanguage = getEffectiveLanguage(preferredLanguage);
  const locale = (await requestLocale) ?? effectiveLanguage;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
