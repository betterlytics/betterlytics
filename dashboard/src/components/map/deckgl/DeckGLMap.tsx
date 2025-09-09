'use client';

import { DeckGL } from '@deck.gl/react';
import { FeatureCollection } from 'geojson';
import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGLStickyTooltip from '@/components/map/deckgl/DeckGLStickyTooltip';
import { useCountriesLayer } from '@/hooks/deckgl/use-countries-layer';
import { MapActionbar } from './controls/MapPlayActionbar';
import { usePlayback } from '@/hooks/deckgl/use-playback';
import { PlaybackSpeed } from './controls/PlaybackSpeedDropdown';

type GeoVisitor = {
  country_code: string;
  visitors: number;
};

interface DeckGLMapProps {
  visitorData: GeoVisitor[];
  initialZoom?: number;
}

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
};

export default function DeckGLMap({ visitorData, initialZoom = 1.5 }: DeckGLMapProps) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---- Build synthetic timeseries for demo ----
  const visitorDataTimeseries: GeoVisitor[][] = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) =>
      visitorData.map((d) => ({
        country_code: d.country_code,
        visitors: Math.max(0, Math.round(d.visitors * (0.5 + 0.5 * Math.sin((i / 40) * Math.PI * 2)))),
      })),
    );
  }, [visitorData]);

  const calculatedMaxVisitors = useMemo(() => {
    return Math.max(...visitorDataTimeseries.flatMap((frame) => frame.map((d) => d.visitors)));
  }, [visitorDataTimeseries]);

  // ---- Playback state (replaces old frameRef + setInterval) ----
  const [speed, setSpeed] = useState(1 as PlaybackSpeed);
  const {
    position, // float progress for slider
    frame, // discrete frame index
    playing,
    toggle,
    stop,
    scrub,
  } = usePlayback({
    frameCount: visitorDataTimeseries.length,
    speed,
  });

  // ---- Load geojson ----
  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  // ---- Current visitors dict ----
  const visitorDict = useMemo(() => {
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  const layers = useCountriesLayer({
    geojson,
    visitorDict,
    playing,
    frameInterval: 1000 / speed, // legacy consumers
    baseInterval: 1000,
    calculatedMaxVisitors,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <DeckGL initialViewState={{ ...INITIAL_VIEW_STATE, zoom: initialZoom }} controller={true} layers={layers}>
        {/* Global map CSS */}
        <style jsx global>
          {`
            .leaflet-container {
              background-color: var(--color-card);
            }
            .leaflet-interactive:focus {
              outline: none !important;
            }
            .leaflet-popup-content {
              margin: 0 0.5rem !important;
              padding: 0 !important;
              display: flex;
              flex-direction: column;
            }
            .leaflet-popup-content,
            .leaflet-popup-tip {
              background-color: var(--color-card);
              filter: drop-shadow(0 0.5px 2px var(--color-sidebar-accent-foreground));
              pointer-events: none;
            }
            .leaflet-popup-content-wrapper {
              background: transparent;
              border: none;
              box-shadow: none;
              padding: 0;
            }
            .leaflet-popup {
              z-index: 11;
              pointer-events: none;
            }
          `}
        </style>

        {/* Controls */}
        <div className='absolute bottom-10 left-[18rem] z-10 w-[calc(100%-20rem)]'>
          <MapActionbar
            ticks={visitorDataTimeseries.map((_, i) => ({
              label: `Frame ${i + 1}`,
              value: i,
            }))}
            value={position}
            playing={playing}
            speed={speed}
            onTogglePlay={toggle}
            onStop={stop}
            onScrub={scrub}
            onChangeSpeed={setSpeed}
          />
        </div>

        {/* Tooltip */}
        {containerRef && <DeckGLStickyTooltip containerRef={containerRef} />}
      </DeckGL>
    </div>
  );
}
