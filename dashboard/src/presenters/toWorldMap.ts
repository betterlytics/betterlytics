import { alpha2ToAlpha3Code, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { GeoVisitor, WorldMapResponse } from '@/entities/geography';
import { countries as countriesWithFlagIcon } from 'country-flag-icons';
import { hashString } from '@/constants/deviceTypes';

export const CountryCodeFormat = {
  ToAlpha2: 'ToAlpha2',
  ToAlpha3: 'ToAlpha3',
  Original: 'Original',
} as const;

export type CountryCodeFormat = (typeof CountryCodeFormat)[keyof typeof CountryCodeFormat];

/**
 * Converts world map data to use Alpha-3 or Alpha-2 country codes for map compatibility
 * @param data Raw world map data in GeoVisitor format
 * @param format The format to convert the country codes to
 * @returns Processed world map data
 */
export function dataToWorldMap(data: GeoVisitor[], format: CountryCodeFormat): WorldMapResponse {
  if (format === CountryCodeFormat.Original) {
    return {
      visitorData: data,
      maxVisitors: Math.max(...data.map((d) => d.visitors), 1),
    };
  }

  let maxVisitors = 1;
  const processedVisitorData = data.map((visitor) => {
    const transformerFunction = format === CountryCodeFormat.ToAlpha2 ? alpha3ToAlpha2Code : alpha2ToAlpha3Code;
    const transformedData = transformerFunction(visitor.country_code);

    const updatedCountryData = transformedData
      ? {
          ...visitor,
          country_code: transformedData,
        }
      : visitor;

    if (updatedCountryData.visitors > maxVisitors && updatedCountryData.country_code !== 'Localhost') {
      maxVisitors = updatedCountryData.visitors;
    }

    return updatedCountryData;
  });

  return {
    visitorData: processedVisitorData,
    maxVisitors,
  };
}

//! TODO: Remove topcountries arg, and information - just pass this explicitly from the user
/**
 * Generates mock visitor data per country.
 *
 * Note: Does not handle edge cases like duplicate country codes or negative max_visitor values.
 *
 * @param visitedCountries - Countries to include (default: those with displayable flag icons).
 * @param max_visitor - Base number of visitors for top countries; also used as a modulo for visitedCountries.
 * @param topCountries - Countries with the highest visitor counts (spaced slightly apart).
 * @returns Array of countries with deterministic visitor counts.
 */
export function mockGeographyData({
  visitedCountries = countriesWithFlagIcon,
  baseVisitors = 900,
  topCountries = ['US', 'GB', 'GE', 'CN'],
}: {
  visitedCountries?: string[];
  baseVisitors?: number;
  topCountries?: string[];
} = {}): GeoVisitor[] {
  return [
    ...topCountries.map((country_code, i) => ({ country_code, visitors: baseVisitors + i * 17 })).reverse(),
    ...visitedCountries
      .map((country_code) => ({ country_code, visitors: hashString(country_code) % baseVisitors }))
      .sort((a, b) => b.visitors - a.visitors),
  ];
}
