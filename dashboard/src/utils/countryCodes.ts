import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

/**
 * Converts an ISO 3166-1 alpha-2 country code to alpha-3
 * @param alpha2 The two-letter country code (e.g., 'DK')
 * @returns The three-letter country code (e.g., 'DNK') or undefined if not found
 */
export function alpha2ToAlpha3Code(alpha2: string): string | undefined {
  return countries.alpha2ToAlpha3(alpha2.toUpperCase());
}

/**
 * Converts an ISO 3166-1 alpha-3 country code to alpha-2
 * @param alpha3 The three-letter country code (e.g., 'DNK')
 * @returns The two-letter country code (e.g., 'DK') or undefined if not found
 */
export function alpha3ToAlpha2Code(alpha3: string): string | undefined {
  return countries.alpha3ToAlpha2(alpha3.toUpperCase());
}

/**
 * Converts an ISO 3166-1 alpha-2 country code to country name
 * @param alpha2 The two-letter country code (e.g., 'DK')
 * @returns The country name (e.g., 'Denmark') or 'Unknown' if not found
 */
export function getCountryName(alpha2: string): string {
  const name = countries.getName(alpha2.toUpperCase(), 'en');
  return name || 'Unknown';
}
