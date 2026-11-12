import type { CRS } from 'leaflet';

// Web Mercator's own latitude clamp
export const POLE_LATITUDE = 85.0511287798;

// The clamp only keeps tile grids finite; with no tiles it can sit far above the pole, so maxBounds can reserve room above the world for the click popup
export function unclampedMercator(L: typeof import('leaflet')): CRS {
  return L.Util.extend({}, L.CRS.EPSG3857, {
    projection: L.Util.extend({}, L.Projection.SphericalMercator, { MAX_LATITUDE: 89.99 }),
  });
}
