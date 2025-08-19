export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const UNLOCALIZED_ROUTES = ['dashboard', 'dashboards', 'billing', 'docs'] as const;
