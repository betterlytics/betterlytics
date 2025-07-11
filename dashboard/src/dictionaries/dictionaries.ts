import { env } from '@/lib/env';

export const SUPPORTED_LANGUAGES = ['en', 'da'] as const;

export const dictionaries = {
  en: () => import(`@/dictionaries/en.json`).then((module) => module.default),
  da: () => import('@/dictionaries/da.json').then((module) => module.default),
};

export type RawDictionary = Awaited<ReturnType<(typeof dictionaries)['en']>>;
export type DictionaryKeys = NestedDictKeyOf<RawDictionary>;

type NestedDictKeyOf<TObj extends object, TSep extends string = '.'> =
  Extract<{
    [K in keyof TObj & (string | number)]: TObj[K] extends object
      ? `${K}` | `${K}${TSep}${NestedDictKeyOf<TObj[K], TSep>}`
      : `${K}`;
  }[keyof TObj & (string | number)], string>;

export type BADictionary = RawDictionary & {
  t: (key: DictionaryKeys, ...args: unknown[]) => string;
};

export type SupportedLanguages = keyof typeof dictionaries;
export const DEFAULT_LANGUAGE: SupportedLanguages = env.DEFAULT_LANGUAGE;

function isLanguageSupported(language: string): language is SupportedLanguages {
  return language in dictionaries;
}

export async function getDictionaryOrDefault(language: string): Promise<RawDictionary> {
  const dictionaryLoader = isLanguageSupported(language) ? dictionaries[language] : dictionaries[DEFAULT_LANGUAGE];
  return await dictionaryLoader();
}

export async function loadDictionary(language: SupportedLanguages): Promise<BADictionary> {
  try {
    const rawDictionary = await getDictionaryOrDefault(language);
    return addTFunction(rawDictionary);
  } catch (error) {
    console.warn(`Failed to load dictionary for language ${language}, falling back to ${DEFAULT_LANGUAGE}`, error);
    const fallbackDictionary = await getDictionaryOrDefault(DEFAULT_LANGUAGE);
    return addTFunction(fallbackDictionary);
  }
}

export function addTFunction(dict: RawDictionary): BADictionary {
  return {
    ...dict,
    t: (key: DictionaryKeys, ...args: unknown[])  => {
      return key.split('.').reduce((current: any, k) => current?.[k], dict) || key;
    },
  };
}

export function getEffectiveLanguage(language: string): SupportedLanguages {
  return isLanguageSupported(language) ? language : DEFAULT_LANGUAGE;
}
