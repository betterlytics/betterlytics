import { GeoFeatureVisitor, GeoMapResponse, GeoVisitor } from '@/entities/analytics/geography.entities';

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

export function dataToWorldMap(data: GeoVisitor[], compareData: GeoVisitor[]): GeoMapResponse {
  return toGeoMap(data, compareData, (v) => v.country_code);
}

export function subdivisionsToGeoMap(data: GeoVisitor[], compareData: GeoVisitor[]): GeoMapResponse {
  return toGeoMap(data, compareData, (v) => v.subdivision_code ?? '');
}
