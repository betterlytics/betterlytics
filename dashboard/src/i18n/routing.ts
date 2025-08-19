import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/constants/i18n';
import { defineRouting } from 'next-intl/routing';

const defaultLocale = (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'en') as SupportedLanguages;

export const routing = defineRouting({
  locales: SUPPORTED_LANGUAGES,
  defaultLocale,
  localePrefix: 'as-needed',
});
