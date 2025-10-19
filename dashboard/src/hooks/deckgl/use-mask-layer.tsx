// useWorldMaskLayer.ts
import { useMemo } from 'react';
import type { FeatureCollection } from 'geojson';
import { GeoJsonLayer } from '@deck.gl/layers';

export type WorldMaskOptions = {
  /** Layer id */
  id?: string;
  /** RGBA color for the mask (default: solid white) */
  color?: [number, number, number, number];
  /** Keep mask above all other layers */
  depthTestDisabled?: boolean;
  /** Latitude clamp for the inner visible window */
  innerLat?: number; // default 85
  /** Slight overrun beyond dateline to avoid seams */
  outerLonOverrun?: number; // default 181
  /** Toggle visibility without removing the layer */
  visible?: boolean;
};

/**
 * Returns a GeoJsonLayer that draws an outer white polygon with a "hole" for your visible world.
 * Place it LAST in your layers array.
 */
export function useWorldMaskLayer(options: WorldMaskOptions = {}) {
  const {
    id = 'world-mask',
    color = [255, 255, 255, 255],
    depthTestDisabled = true,
    innerLat = 85,
    outerLonOverrun = 181,
    visible = true,
  } = options;

  const maskGeojson = useMemo<FeatureCollection>(() => {
    const o = outerLonOverrun;
    const outer = [
      [-o, -90],
      [o, -90],
      [o, 90],
      [-o, 90],
      [-o, -90],
    ];
    const lat = Math.max(0, Math.min(89.9999, innerLat)); // clamp sensibly
    const inner = [
      [-180, -lat],
      [-180, lat],
      [180, lat],
      [180, -lat],
      [-180, -lat],
    ];

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id,
          properties: {},
          geometry: { type: 'Polygon', coordinates: [outer, inner] },
        },
      ],
    };
  }, [id, innerLat, outerLonOverrun]);

  const layer = useMemo(() => {
    return new GeoJsonLayer({
      id,
      data: maskGeojson,
      visible,
      filled: true,
      stroked: false,
      pickable: false,
      wrapLongitude: false,
      parameters: depthTestDisabled ? { depthTest: false } : undefined,
      getFillColor: color,
    });
  }, [id, maskGeojson, visible, color, depthTestDisabled]);

  return layer;
}
