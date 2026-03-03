/** Resolved display info for any geographic feature */
export type GeoFeatureDisplay = {
  name: string;
  /** ISO country code for FlagIcon; undefined = no flag */
  countryCode?: string;
};

/** Strategy to resolve feature ID → display info */
export type FeatureDisplayResolver = (featureId: string) => GeoFeatureDisplay;
