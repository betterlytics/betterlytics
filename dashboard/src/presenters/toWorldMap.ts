import { alpha2ToAlpha3Code, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { GeoFeatureVisitor, GeoMapResponse, GeoVisitor } from '@/entities/analytics/geography.entities';

export const CountryCodeFormat = {
  ToAlpha2: 'ToAlpha2',
  ToAlpha3: 'ToAlpha3',
  Original: 'Original',
} as const;

export type CountryCodeFormat = (typeof CountryCodeFormat)[keyof typeof CountryCodeFormat];

function maxVisitorsOf(data: GeoFeatureVisitor[]): number {
  return Math.max(1, ...data.filter((d) => d.code !== 'Localhost').map((d) => d.visitors));
}

export function dataToWorldMap(
  data: GeoVisitor[],
  compareData: GeoVisitor[],
  format: CountryCodeFormat,
): GeoMapResponse {
  const transform =
    format === CountryCodeFormat.Original
      ? (code: string) => code
      : format === CountryCodeFormat.ToAlpha2
        ? (code: string) => alpha3ToAlpha2Code(code) ?? code
        : (code: string) => alpha2ToAlpha3Code(code) ?? code;

  const visitorData = data.map((v) => ({ code: transform(v.country_code), visitors: v.visitors }));
  return {
    visitorData,
    compareData: compareData.map((v) => ({ code: transform(v.country_code), visitors: v.visitors })),
    maxVisitors: maxVisitorsOf(visitorData),
  };
}
