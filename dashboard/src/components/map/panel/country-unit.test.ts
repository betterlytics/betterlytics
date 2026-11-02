import { describe, expect, it } from 'vitest';
import { countryAsOneUnit, countryOutline } from '@/components/map/panel/country-unit';

const world = {
  visitorData: [
    { code: 'GL', visitors: 59 },
    { code: 'DK', visitors: 300 },
  ],
  compareData: [{ code: 'GL', visitors: 1 }],
  maxVisitors: 300,
};

describe('countryAsOneUnit', () => {
  it('keeps only the country and scales the legend to it', () => {
    expect(countryAsOneUnit(world, 'GL')).toEqual({
      visitorData: [{ code: 'GL', visitors: 59 }],
      compareData: [{ code: 'GL', visitors: 1 }],
      maxVisitors: 59,
    });
  });

  it('yields an empty unit for a country without visitors', () => {
    expect(countryAsOneUnit(world, 'LU')).toEqual({ visitorData: [], compareData: [], maxVisitors: 0 });
  });
});

describe('countryOutline', () => {
  const outlines: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'LU',
        properties: { name: 'Luxembourg' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [5.7, 49.4],
              [6.5, 49.4],
              [6.5, 50.2],
              [5.7, 50.2],
              [5.7, 49.4],
            ],
          ],
        },
      },
    ],
  };

  it('wraps the country polygon as a single-feature collection with its view box', () => {
    const outline = countryOutline(outlines, 'LU');
    expect(outline?.features.map((f) => f.id)).toEqual(['LU']);
    expect(outline?.viewBbox).toEqual([5.7, 49.4, 6.5, 50.2]);
  });

  it('returns null when the world map has no polygon for the country', () => {
    expect(countryOutline(outlines, 'SG')).toBeNull();
  });
});
