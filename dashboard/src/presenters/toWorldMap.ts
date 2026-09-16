import { alpha2ToAlpha3Code, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { GeoFeatureVisitor, GeoMapResponse, GeoVisitor } from '@/entities/analytics/geography.entities';

export const CountryCodeFormat = {
  ToAlpha2: 'ToAlpha2',
  ToAlpha3: 'ToAlpha3',
  Original: 'Original',
} as const;

export type CountryCodeFormat = (typeof CountryCodeFormat)[keyof typeof CountryCodeFormat];

function maxVisitorsOf(data: GeoFeatureVisitor[]): number {
  return Math.max(1, ...data.filter((d) => d.code && d.code !== 'Localhost').map((d) => d.visitors));
}

function toGeoMap(
  data: GeoVisitor[],
  compareData: GeoVisitor[],
  codeOf: (v: GeoVisitor) => string,
): GeoMapResponse {
  const toFeature = (v: GeoVisitor): GeoFeatureVisitor => ({ code: codeOf(v), visitors: v.visitors });
  const visitorData = data.map(toFeature);
  return {
    visitorData,
    compareData: compareData.map(toFeature),
    maxVisitors: maxVisitorsOf(visitorData),
  };
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

  return toGeoMap(data, compareData, (v) => transform(v.country_code));
}

export function subdivisionsToGeoMap(data: GeoVisitor[], compareData: GeoVisitor[]): GeoMapResponse {
  return toGeoMap(data, compareData, (v) => v.subdivision_code ?? '');
}
