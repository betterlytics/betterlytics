import { enUS, da, it } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export const SUPPORTED_LANGUAGES = ['en', 'da', 'it'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_METADATA = {
  en: { name: 'English', code: 'GB', ogLocale: 'en_GB', dateFnsLocale: enUS },
  da: { name: 'Dansk', code: 'DK', ogLocale: 'da_DK', dateFnsLocale: da },
  it: { name: 'Italiano', code: 'IT', ogLocale: 'it_IT', dateFnsLocale: it },
} as const satisfies Record<
  SupportedLanguages,
  { name: string; code: string; ogLocale: string; dateFnsLocale: Locale }
>;

export function resolveDateFnsLocale(locale: SupportedLanguages): Locale {
  return LANGUAGE_METADATA[locale]?.dateFnsLocale ?? enUS;
}
