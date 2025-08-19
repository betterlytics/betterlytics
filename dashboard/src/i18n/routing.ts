import { SUPPORTED_LANGUAGES } from '@/constants/supportedLanguages';
import { env } from '@/lib/env';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: SUPPORTED_LANGUAGES,
  defaultLocale: env.PUBLIC_DEFAULT_LANGUAGE,
  localePrefix: 'as-needed',
});
