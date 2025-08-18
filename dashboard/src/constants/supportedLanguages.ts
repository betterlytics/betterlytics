export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;
export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE = ((process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as SupportedLanguages) ??
  'en') satisfies SupportedLanguages;
