import { cssVar, MAP_FEATURE_BORDER_COLORS } from '@/constants/mapColors';
import type { InsetFrame } from '@/components/map/types';
import { bboxToLatLngs } from '@/components/map/bbox';
import React, { useMemo } from 'react';
import type { Marker, Rectangle } from 'react-leaflet';

type MapInsetFramesProps = {
  L: typeof import('leaflet');
  Rectangle: typeof Rectangle;
  Marker: typeof Marker;
  frames: InsetFrame[];
};

const FRAME_PATH_OPTIONS = {
  color: cssVar(MAP_FEATURE_BORDER_COLORS.NO_VISITORS),
  weight: 1,
  dashArray: '4 4',
  fill: false,
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function MapInsetFrames({ L, Rectangle, Marker, frames }: MapInsetFramesProps) {
  const labelledFrames = useMemo(
    () =>
      frames.map((frame) => ({
        frame,
        icon: L.divIcon({
          className: 'map-inset-label',
          html: `<span>${escapeHtml(frame.label)}</span>`,
          iconSize: [0, 0],
        }),
      })),
    [L, frames],
  );

  return (
    <>
      {labelledFrames.map(({ frame, icon }) => {
        const [minLon, minLat, maxLon] = frame.bbox;
        return (
          <React.Fragment key={frame.label}>
            <Rectangle bounds={bboxToLatLngs(frame.bbox)} interactive={false} pathOptions={FRAME_PATH_OPTIONS} />
            <Marker position={[minLat, (minLon + maxLon) / 2]} interactive={false} keyboard={false} icon={icon} />
          </React.Fragment>
        );
      })}
    </>
  );
}
