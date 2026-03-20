import 'server-only';
import { env } from '@/lib/env';
import type { GeoLevel } from '@/entities/analytics/geography.entities';

export function getEnabledGeoLevels(): GeoLevel[] {
  if (!env.ENABLE_GEOLOCATION) return [];
  if (!env.ENABLE_GEOSUBDIVISION) return ['country_code'];
  return ['country_code', 'subdivision_code', 'city'];
}
