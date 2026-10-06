import 'server-only';
import { env } from '@/lib/env';
import type { GeoLevel } from '@/entities/analytics/geography.entities';

function levelsForMode(): GeoLevel[] {
  if (env.GEOLOCATION_MODE === 'full') return ['country_code', 'subdivision_code', 'city'];
  return ['country_code'];
}

/** Levels the backend is currently writing. Empty when collection is switched off. */
export function getCollectedGeoLevels(): GeoLevel[] {
  return env.ENABLE_GEOLOCATION ? levelsForMode() : [];
}

/**
 * Levels the dashboard may query. Rows already in ClickHouse outlive the collection
 * switch, so turning geolocation off must not blank out history that was collected
 * while it was on.
 */
export function getQueryableGeoLevels(): GeoLevel[] {
  return levelsForMode();
}
