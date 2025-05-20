export * from '@/locale/dictionary/en';
export * from '@/locale/dictionary/da';
export * from '@/locale/i18n'

import { en } from '@/locale/dictionary/en';
import { da } from '@/locale/dictionary/da';

export const dictionaries = { en, da };
export type AvailableLocales = keyof typeof dictionaries;
export type MessageSchema = typeof en;
export const DEFAULT_LOCALE: AvailableLocales = 'en' as const;
export const LOCALES = Object.keys(dictionaries) as AvailableLocales[];
export const LOCALE_TO_ALPHA2 = {
  en: 'GB',
  da: 'DK',
} satisfies Record<AvailableLocales, string>;
 