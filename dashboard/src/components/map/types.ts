import type { Bbox } from '@/components/map/bbox';

export type GeoFeatureDisplay = {
  name: string;
  countryCode: string;
};

export type FeatureDisplayResolver = (featureId: string) => GeoFeatureDisplay;

export type InsetFrame = {
  bbox: Bbox;
  label: string;
};

export type RegionGeoJson = GeoJSON.FeatureCollection & {
  insets?: InsetFrame[];
  viewBbox?: Bbox;
  attribution?: { text: string; href: string };
};
