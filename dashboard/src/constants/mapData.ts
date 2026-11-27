export const WORLD_GEOJSON_URL = '/data/countries.geo.json';

export function regionGeoJsonUrl(countryCode: string): string {
  return `/data/regions/${countryCode}.geo.json`;
}
