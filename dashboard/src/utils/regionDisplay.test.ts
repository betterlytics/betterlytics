import { describe, expect, it } from 'vitest';
import { createRegionDisplayResolver } from './regionDisplay';
import { getSubdivisionName } from './subdivisionCodes';
import type { RegionGeoJson } from '@/components/map/types';

const geoJson: RegionGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'PR-X00~',
      properties: { name: 'Puerto Rico' },
      geometry: { type: 'Polygon', coordinates: [] },
    },
  ],
};

describe('createRegionDisplayResolver', () => {
  it('resolves current ISO codes through CLDR with the parent country flag', () => {
    const resolve = createRegionDisplayResolver('DK', geoJson, 'en');
    const display = resolve('DK-84');
    expect(display.name).toBe(getSubdivisionName('DK-84', 'en'));
    expect(display.name).not.toBe('DK-84');
    expect(display.countryCode).toBe('DK');
  });

  it('falls back to geojson properties for pseudo ids CLDR cannot resolve', () => {
    const resolve = createRegionDisplayResolver('PR', geoJson, 'en');
    expect(resolve('PR-X00~').name).toBe('Puerto Rico');
  });

  it('falls back to the raw code when nothing resolves', () => {
    const resolve = createRegionDisplayResolver('DK', undefined, 'en');
    expect(resolve('DK-999').name).toBe('DK-999');
  });
});
