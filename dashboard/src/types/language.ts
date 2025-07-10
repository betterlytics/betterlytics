export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;
export type SupportedLanguages = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguages = 'en';

export const LANGUAGE_TO_NAME = {
  en: 'English',
  da: 'Danish',
} as Record<SupportedLanguages, string>;