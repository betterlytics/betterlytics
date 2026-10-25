import type { GeoMapResponse } from '@/entities/analytics/geography.entities';
import type { RegionGeoJson } from '@/components/map/types';
import { bboxOf } from '@/components/map/bbox';

// Countries without a regional map render as one feature
export function countryAsOneUnit(world: GeoMapResponse, countryCode: string): GeoMapResponse {
  const visitorData = world.visitorData.filter((d) => d.code === countryCode);
  const compareData = world.compareData.filter((d) => d.code === countryCode);
  return { visitorData, compareData, maxVisitors: visitorData[0]?.visitors ?? 0 };
}

export function countryOutline(world: GeoJSON.FeatureCollection, countryCode: string): RegionGeoJson | null {
  const feature = world.features.find((f) => f.id === countryCode);
  return feature ? { type: 'FeatureCollection', features: [feature], viewBbox: bboxOf(feature.geometry) } : null;
}
