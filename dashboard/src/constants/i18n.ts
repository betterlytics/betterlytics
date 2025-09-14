export const SUPPORTED_LANGUAGES = ['en', 'da', 'it'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_METADATA = {
  en: { name: 'English', code: 'GB' },
  da: { name: 'Dansk', code: 'DK' },
  it: { name: 'Italiano', code: 'IT' },
} as const satisfies Record<SupportedLanguages, { name: string; code: string }>;
