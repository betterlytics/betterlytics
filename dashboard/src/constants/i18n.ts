export const SUPPORTED_LANGUAGES = ['en', 'da', 'it'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_METADATA = {
  en: { name: 'English', code: 'GB', ogLocale: 'en_GB' },
  da: { name: 'Dansk', code: 'DK', ogLocale: 'da_DK' },
  it: { name: 'Italiano', code: 'IT', ogLocale: 'it_IT' },
} as const satisfies Record<SupportedLanguages, { name: string; code: string; ogLocale: string }>;
