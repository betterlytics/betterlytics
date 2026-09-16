/** Resolved display info for any geographic feature */
export type GeoFeatureDisplay = {
  name: string;
  /** ISO country code for FlagIcon; undefined = no flag */
  countryCode?: string;
};

/** Strategy to resolve feature id → display info */
export type FeatureDisplayResolver = (featureId: string) => GeoFeatureDisplay;

/** Frame rectangle for a relocated inset (minLon, minLat, maxLon, maxLat), from the region build */
export type InsetFrame = {
  bbox: [number, number, number, number];
  label: string;
  scale: number;
};

/** Region files always carry viewBbox (fit-bounds target, minLon/minLat/maxLon/maxLat); the world file has neither member */
export type RegionGeoJson = GeoJSON.FeatureCollection & {
  insets?: InsetFrame[];
  viewBbox?: [number, number, number, number];
};

export const hideAntarcticaWhenEmpty = (featureId: string) => featureId === 'AQ';
