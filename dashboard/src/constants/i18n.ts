export const SUPPORTED_LANGUAGES = ['en', 'da', 'it'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];
