import { getSubdivisionName } from '@/utils/subdivisionCodes';
import { getCountryName } from '@/utils/countryCodes';
import type { SupportedLanguages } from '@/constants/i18n';
import type { FeatureDisplayResolver, RegionGeoJson } from '@/components/map/types';

export function createRegionDisplayResolver(
  countryCode: string,
  geoJson: RegionGeoJson | null | undefined,
  locale: SupportedLanguages,
): FeatureDisplayResolver {
  const geoJsonNames = new Map<string, string>();
  for (const feature of geoJson?.features ?? []) {
    if (feature.id && typeof feature.properties?.name === 'string') {
      geoJsonNames.set(String(feature.id), feature.properties.name);
    }
  }

  return (featureId) => {
    if (featureId === countryCode) return { name: getCountryName(countryCode, locale), countryCode };
    const cldrName = getSubdivisionName(featureId, locale);
    const name = cldrName !== featureId ? cldrName : (geoJsonNames.get(featureId) ?? featureId);
    return { name, countryCode };
  };
}
