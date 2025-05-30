export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;

export const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  da: () => import('@/dictionaries/da.json').then((module) => module.default),
};

export type BADictionary = Awaited<ReturnType<typeof getDictionaryOrDefault>>;

export type SupportedLanguages = keyof typeof dictionaries;
export const DEFAULT_LANGUAGE: SupportedLanguages = 'en';

function isLanguageSupported(language: string): language is SupportedLanguages {
  return language in dictionaries;
}

export function getDictionaryOrDefault(language: string) {
  const dictionaryLoader = isLanguageSupported(language) ? dictionaries[language] : dictionaries[DEFAULT_LANGUAGE];
  return dictionaryLoader();
}
