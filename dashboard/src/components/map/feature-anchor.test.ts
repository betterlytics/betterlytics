import { describe, expect, it } from 'vitest';
import type { LatLng } from 'leaflet';
import { largestRingCenter } from '@/components/map/feature-anchor';

const point = (lat: number, lng: number) => ({ lat, lng }) as LatLng;
const square = (lat: number, lng: number, size: number) => [
  point(lat, lng),
  point(lat + size, lng),
  point(lat + size, lng + size),
  point(lat, lng + size),
];

describe('largestRingCenter', () => {
  it('centers on the largest polygon of a multipolygon instead of the first', () => {
    const island = square(19, -156, 2);
    const mainland = square(30, -120, 20);
    const layer = { getLatLngs: () => [[island], [mainland]] };
    expect(largestRingCenter(layer)).toEqual({ lat: 40, lng: -110 });
  });

  it('uses the outer ring of a single polygon and ignores holes', () => {
    const outer = square(0, 0, 10);
    const hole = square(4, 4, 2);
    const layer = { getLatLngs: () => [outer, hole] };
    expect(largestRingCenter(layer)).toEqual({ lat: 5, lng: 5 });
  });

  it('handles a flat ring', () => {
    const layer = { getLatLngs: () => square(10, 10, 4) };
    expect(largestRingCenter(layer)).toEqual({ lat: 12, lng: 12 });
  });

  it('returns undefined for an empty layer', () => {
    expect(largestRingCenter({ getLatLngs: () => [] })).toBeUndefined();
  });
});
