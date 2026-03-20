import 'server-only';
import { env } from '@/lib/env';
import type { GeoLevel } from '@/entities/analytics/geography.entities';

export function getEnabledGeoLevels(): GeoLevel[] {
  switch (env.GEOLOCATION_MODE) {
    case 'full':
      return ['country_code', 'subdivision_code', 'city'];
    case 'countries':
      return ['country_code'];
    default:
      return [];
  }
}
