import { alpha2ToAlpha3Code, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { GeoVisitor, WorldMapResponse } from '@/entities/geography';
import { computeNormalizedMax, interpolatedQuantile, niceMax } from '@/lib/statistics';

export const CountryCodeFormat = {
  ToAlpha2: 'ToAlpha2',
  ToAlpha3: 'ToAlpha3',
  Original: 'Original',
} as const;

export type CountryCodeFormat = (typeof CountryCodeFormat)[keyof typeof CountryCodeFormat];

/**
 * Converts world map data to use Alpha-3 or Alpha-2 country codes and computes a normalized maxVisitors
 * for color scaling.
 * @param data Raw world map data in GeoVisitor format
 * @param format Country code format
 * @param hiQuantile Quantile cutoff for normalization (0..1)
 * @returns Processed world map data
 */
export function dataToWorldMap(
  data: GeoVisitor[],
  format: CountryCodeFormat,
  hiQuantile: number = 0.975,
): WorldMapResponse {
  const transformerFunction =
    format === CountryCodeFormat.ToAlpha2
      ? alpha3ToAlpha2Code
      : format === CountryCodeFormat.ToAlpha3
        ? alpha2ToAlpha3Code
        : null;

  const processedVisitorData = transformerFunction
    ? data.map((visitor) => {
        const transformedData = transformerFunction(visitor.country_code);
        return transformedData ? { ...visitor, country_code: transformedData } : visitor;
      })
    : data;

  const maxVisitors = computeNormalizedMax(
    processedVisitorData.map((d) => d.visitors),
    hiQuantile,
  );

  return {
    visitorData: processedVisitorData,
    maxVisitors: niceMax(maxVisitors),
  };
}
