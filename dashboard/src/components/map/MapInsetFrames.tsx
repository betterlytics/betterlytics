import { cssVar, MAP_FEATURE_BORDER_COLORS } from '@/constants/mapColors';
import type { InsetFrame } from '@/components/map/types';
import React from 'react';
import type { Marker, Rectangle } from 'react-leaflet';

type MapInsetFramesProps = {
  L: typeof import('leaflet');
  Rectangle: typeof Rectangle;
  Marker: typeof Marker;
  frames: InsetFrame[];
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function MapInsetFrames({ L, Rectangle, Marker, frames }: MapInsetFramesProps) {
  return (
    <>
      {frames.map((frame) => {
        const [minLon, minLat, maxLon, maxLat] = frame.bbox;
        return (
          <React.Fragment key={frame.label}>
            <Rectangle
              bounds={[
                [minLat, minLon],
                [maxLat, maxLon],
              ]}
              interactive={false}
              pathOptions={{
                color: cssVar(MAP_FEATURE_BORDER_COLORS.NO_VISITORS),
                weight: 1,
                dashArray: '4 4',
                fill: false,
              }}
            />
            <Marker
              position={[minLat, (minLon + maxLon) / 2]}
              interactive={false}
              keyboard={false}
              icon={L.divIcon({
                className: 'map-inset-label',
                html: escapeHtml(frame.label),
                iconSize: [0, 0],
              })}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
