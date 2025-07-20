import React from 'react';

export const dictionaries = {
  en: () => import(`@/dictionaries/en.json`).then((module) => module.default),
  da: () => import('@/dictionaries/da.json').then((module) => module.default),
};

export type RawDictionary = Awaited<ReturnType<(typeof dictionaries)['en']>>;
export type DictionaryKeys = NestedDictKeyOf<RawDictionary>;

type NestedDictKeyOf<TObj extends object, TSep extends string = '.'> = Extract<
  {
    [K in keyof TObj & (string | number)]: TObj[K] extends object
      ? `${K}` | `${K}${TSep}${NestedDictKeyOf<TObj[K], TSep>}`
      : `${K}`;
  }[keyof TObj & (string | number)],
  string
>;

type Primitive = string | number;

type AllValuesArePrimitive<T extends Record<string, any>> =
  Exclude<T[keyof T], Primitive> extends never ? true : false;

export type BADictionary = RawDictionary & {
  t: <T extends Record<string, any> | undefined = undefined>(
    key: DictionaryKeys,
    values?: T,
  ) => T extends undefined
    ? string
    : T extends Record<string, any>
      ? AllValuesArePrimitive<T> extends true
        ? string
        : React.ReactNode[]
      : string; // fallback for unexpected T
};

export type SupportedLanguages = keyof typeof dictionaries;
export const DEFAULT_LANGUAGE: SupportedLanguages = (process.env.DEFAULT_LANGUAGE as SupportedLanguages) ?? 'en';

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

function interpolateReact(template: string, values: Record<string, React.ReactNode>): React.ReactNode[] {
  const parts = template.split(/({{.*?}})/g);
  return parts.map((part, i) => {
    const match = part.match(/{{\s*(\w+)\s*}}/);
    if (match) {
      const key = match[1];
      return <React.Fragment key={key + i}>{values[key]}</React.Fragment>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function addTFunction(dict: RawDictionary): BADictionary {
  return {
    ...dict,
    t: (key, values) => {
      const template = key.split('.').reduce((current: any, k) => current?.[k], dict);
      if (!template) return key;

      if (!values) return template;

      const allStrings = Object.values(values).every((v) => typeof v === 'string' || typeof v === 'number');

      if (allStrings) {
        return Object.entries(values).reduce(
          (result, [argKey, value]) => result.replace(new RegExp(`{{\\s*${argKey}\\s*}}`, 'g'), String(value)),
          template,
        );
      }

      return interpolateReact(template, values as Record<string, React.ReactNode>);
    },
  };
}

export function getEffectiveLanguage(language: string): SupportedLanguages {
  return isLanguageSupported(language) ? language : DEFAULT_LANGUAGE;
}
