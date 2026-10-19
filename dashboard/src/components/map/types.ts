export type GeoFeatureDisplay = {
  name: string;
  countryCode?: string;
};

export type FeatureDisplayResolver = (featureId: string) => GeoFeatureDisplay;

export type InsetFrame = {
  bbox: [number, number, number, number];
  label: string;
};

// Boxes are [minLon, minLat, maxLon, maxLat]; the world file has neither member
export type RegionGeoJson = GeoJSON.FeatureCollection & {
  insets?: InsetFrame[];
  viewBbox?: [number, number, number, number];
};
