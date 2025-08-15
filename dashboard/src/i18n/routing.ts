import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/constants/supportedLanguages';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: SUPPORTED_LANGUAGES,
  defaultLocale: DEFAULT_LANGUAGE,
  localePrefix: 'as-needed',
});
