import { enGB, da, it, hi } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export const SUPPORTED_LANGUAGES = ['en', 'da', 'it', 'hi'] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_METADATA = {
  en: { name: 'English', code: 'GB', ogLocale: 'en_GB', dateFnsLocale: enGB },
  da: { name: 'Dansk', code: 'DK', ogLocale: 'da_DK', dateFnsLocale: da },
  it: { name: 'Italiano', code: 'IT', ogLocale: 'it_IT', dateFnsLocale: it },
  hi: { name: 'हिन्दी', code: 'IN', ogLocale: 'hi_IN', dateFnsLocale: hi },
} as const satisfies Record<
  SupportedLanguages,
  { name: string; code: string; ogLocale: string; dateFnsLocale: Locale }
>;

export function resolveDateFnsLocale(locale: SupportedLanguages): Locale {
  return LANGUAGE_METADATA[locale]?.dateFnsLocale ?? enGB;
}
