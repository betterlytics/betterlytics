import { alpha2ToAlpha3Code, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { GeoFeatureVisitor, GeoMapResponse } from '@/entities/analytics/geography.entities';

export const CountryCodeFormat = {
  ToAlpha2: 'ToAlpha2',
  ToAlpha3: 'ToAlpha3',
  Original: 'Original',
} as const;

export type CountryCodeFormat = (typeof CountryCodeFormat)[keyof typeof CountryCodeFormat];

/**
 * Converts world map data to use Alpha-3 or Alpha-2 country codes for map compatibility
 * @param data Raw world map data with `code` as country code
 * @param compareData Raw world map data from the comparison period or empty array if none
 * @param format The format to convert the country codes to
 * @returns Processed world map data
 */
export function dataToWorldMap(
  data: GeoFeatureVisitor[],
  compareData: GeoFeatureVisitor[],
  format: CountryCodeFormat,
): GeoMapResponse {
  if (format === CountryCodeFormat.Original) {
    return {
      visitorData: data,
      maxVisitors: Math.max(...data.map((d) => d.visitors), 1),
      compareData: compareData,
    };
  }
  const transformerFunction = format === CountryCodeFormat.ToAlpha2 ? alpha3ToAlpha2Code : alpha2ToAlpha3Code;

  const processedVisitorData = data.map((visitor) => {
    const transformedCode = transformerFunction(visitor.code);
    return transformedCode ? { ...visitor, code: transformedCode } : visitor;
  });

  const maxVisitors = Math.max(
    ...processedVisitorData.filter((v) => v.code !== 'Localhost').map((v) => v.visitors),
    1,
  );

  const processedCompareData = compareData.map((visitor) => {
    const transformedCode = transformerFunction(visitor.code);
    return transformedCode
      ? {
          ...visitor,
          code: transformedCode,
        }
      : visitor;
  });

  return {
    visitorData: processedVisitorData,
    compareData: processedCompareData,
    maxVisitors,
  };
}
