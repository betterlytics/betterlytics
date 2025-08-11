import { getUserSettingsAction } from '@/app/actions/userSettings';
import { DEFAULT_LANGUAGE, getEffectiveLanguage } from '@/dictionaries/dictionaries';
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  const result = await getUserSettingsAction();

  console.log(result);
  const language = result.success ? result.data.language : DEFAULT_LANGUAGE;
  const effectiveLanguage = getEffectiveLanguage(language);
  const locale = (await headers()).get('x-locale') ?? effectiveLanguage;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
