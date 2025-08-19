export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];
