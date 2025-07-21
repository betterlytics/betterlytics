import en from './en';
import da from './da';

export const dictionaries = {
  en,
  da,
};

export type RawDictionary = typeof dictionaries.en;
export type DictionaryKeys = NestedDictKeyOf<RawDictionary>;

type NestedDictKeyOf<TObj extends object, TSep extends string = '.'> = Extract<
  {
    [K in keyof TObj & (string | number)]: TObj[K] extends object
      ? `${K}` | `${K}${TSep}${NestedDictKeyOf<TObj[K], TSep>}`
      : `${K}`;
  }[keyof TObj & (string | number)],
  string
>;

export type BADictionary = RawDictionary & {
  t: (key: DictionaryKeys, ...args: unknown[]) => string;
};

export type SupportedLanguages = keyof typeof dictionaries;
export const DEFAULT_LANGUAGE: SupportedLanguages = (process.env.DEFAULT_LANGUAGE as SupportedLanguages) ?? 'en';

export function isLanguageSupported(language: string): language is SupportedLanguages {
  return language in dictionaries;
}

export function getDictionaryOrDefault(language: string): RawDictionary {
  return isLanguageSupported(language) ? dictionaries[language] : dictionaries[DEFAULT_LANGUAGE];
}

export function loadDictionary(language: SupportedLanguages): BADictionary {
  try {
    const rawDictionary = getDictionaryOrDefault(language);
    return addTFunction(rawDictionary);
  } catch (error) {
    console.warn(`Failed to load dictionary for language ${language}, falling back to ${DEFAULT_LANGUAGE}`, error);
    const fallbackDictionary = getDictionaryOrDefault(DEFAULT_LANGUAGE);
    return addTFunction(fallbackDictionary);
  }
}

export function languageToDateLocale(language: SupportedLanguages): Intl.LocalesArgument {
  switch (language) {
    case 'da':
      return 'da-DK';
    case 'en':
      return 'en-GB';
    default:
      return 'en-GB';
  }
}

export function addTFunction(dict: RawDictionary): BADictionary {
  return {
    ...dict,
    t: (key: DictionaryKeys, ...args: unknown[]) => {
      return key.split('.').reduce((current: any, k) => current?.[k], dict) || key;
    },
  };
}

export function getEffectiveLanguage(language: string): SupportedLanguages {
  return isLanguageSupported(language) ? language : DEFAULT_LANGUAGE;
}
