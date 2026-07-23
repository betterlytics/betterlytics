import { SupportedLanguages } from '@/constants/i18n';
import en from 'cldr-subdivisions-full/subdivisions/en/en.json';
import da from 'cldr-subdivisions-full/subdivisions/da/da.json';
import it from 'cldr-subdivisions-full/subdivisions/it/it.json';
import no from 'cldr-subdivisions-full/subdivisions/no/no.json';

type SubdivisionData = Record<string, string>;

const subdivisionsByLocale: Record<SupportedLanguages, SubdivisionData> = {
  en: en.subdivisions.localeDisplayNames.subdivisions,
  da: da.subdivisions.localeDisplayNames.subdivisions,
  it: it.subdivisions.localeDisplayNames.subdivisions,
  nb: no.subdivisions.localeDisplayNames.subdivisions,
};

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
