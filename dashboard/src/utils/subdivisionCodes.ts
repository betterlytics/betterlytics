import { SupportedLanguages, SUPPORTED_LANGUAGES } from '@/constants/i18n';

type SubdivisionData = Record<string, string>;
type CldrLocale = Exclude<SupportedLanguages, 'nb'> | 'no';

const CLDR_LOCALE_MAP: Record<SupportedLanguages, CldrLocale> = SUPPORTED_LANGUAGES.reduce(
  (acc, lang) => ({ ...acc, [lang]: lang === 'nb' ? 'no' : lang }),
  {} as Record<SupportedLanguages, CldrLocale>,
);

const subdivisionsByLocale: Partial<Record<SupportedLanguages, SubdivisionData>> = {};

async function registerLocales() {
  await Promise.all(
    (Object.entries(CLDR_LOCALE_MAP) as [SupportedLanguages, CldrLocale][]).map(async ([lang, cldrLang]) => {
      try {
        const data = (await import(`cldr-subdivisions-full/subdivisions/${cldrLang}/${cldrLang}.json`)).default;
        subdivisionsByLocale[lang] = data.subdivisions.localeDisplayNames.subdivisions;
      } catch {
        // Locale data missing — getSubdivisionName will fall back to 'en' or raw code
      }
    }),
  );
}

registerLocales();

/**
 * Converts an ISO 3166-2 code to the CLDR BCP47 subdivision key
 * @param isoCode The ISO 3166-2 code (e.g., 'US-CA', 'GB-ENG')
 * @returns The CLDR key (e.g., 'usca', 'gbeng')
 */
function toCldrKey(isoCode: string): string {
  return isoCode.toLowerCase().replace('-', '');
}

/**
 * Converts an ISO 3166-2 subdivision code to a human-readable name
 * @param isoCode The subdivision code (e.g., 'US-CA', 'GB-ENG', 'KR-11')
 * @param locale The locale for the subdivision name (e.g., 'en', 'it', 'da')
 * @returns The subdivision name (e.g., 'California') or the raw code if not found
 */
export function getSubdivisionName(isoCode: string, locale: SupportedLanguages): string {
  const key = toCldrKey(isoCode);
  const name = subdivisionsByLocale[locale]?.[key] ?? subdivisionsByLocale['en']?.[key];
  return name || isoCode;
}
