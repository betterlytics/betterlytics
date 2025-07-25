import { alpha2ToAlpha3Code, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { GeoVisitor, WorldMapResponse } from '@/entities/geography';

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
