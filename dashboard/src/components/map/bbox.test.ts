import { describe, expect, it } from 'vitest';
import { bboxOf } from '@/components/map/bbox';

describe('bboxOf', () => {
  it('spans every ring of a polygon', () => {
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [10, 50],
          [12, 54],
          [8, 52],
          [10, 50],
        ],
      ],
    };
    expect(bboxOf(polygon)).toEqual([8, 50, 12, 54]);
  });

  it('spans every part of a multipolygon', () => {
    const multiPolygon: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [10, 50],
            [11, 51],
            [10, 51],
            [10, 50],
          ],
        ],
        [
          [
            [-20, -5],
            [-19, -4],
            [-20, -4],
            [-20, -5],
          ],
        ],
      ],
    };
    expect(bboxOf(multiPolygon)).toEqual([-20, -5, 11, 51]);
  });
});
