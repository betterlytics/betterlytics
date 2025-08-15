export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;
export const DEFAULT_LANGUAGE: SupportedLanguages = 'en';

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];
