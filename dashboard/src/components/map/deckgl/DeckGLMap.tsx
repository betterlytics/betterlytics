'use client';

import { DeckGL } from '@deck.gl/react';
import { FeatureCollection } from 'geojson';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DeckGLStickyTooltip from '@/components/map/deckgl/DeckGLStickyTooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCountriesLayer } from '@/hooks/deckgl/use-countries-layer';

type GeoVisitor = {
  country_code: string;
  visitors: number;
};

interface DeckGLMapProps {
  visitorData: GeoVisitor[];
  // maxVisitors: number;
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
  const [playing, setPlaying] = useState(false);
  const [intervalMultiplier, setIntervalMultiplier] = useState(1);
  const [frame, setFrameState] = useState(0);
  console.log('DeckGLMap render', { frame, playing });

  const frameRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  const baseInterval = 1000;
  const frameInterval = baseInterval / intervalMultiplier;

  const playPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const setFrame = useCallback(
    (newFrame: number) => {
      frameRef.current = Math.max(0, Math.min(visitorDataTimeseries.length - 1, newFrame));
      setFrameState(frameRef.current);
    },
    [visitorDataTimeseries],
  );

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % visitorDataTimeseries.length;
      setFrameState(frameRef.current);
    }, frameInterval);
    return () => clearInterval(interval);
  }, [playing, visitorDataTimeseries.length, frameInterval]);

  const visitorDict = useMemo(() => {
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = Number(e.target.value);
    setFrame(newFrame);
    setPlaying(false);
  };

  const layers = useCountriesLayer({
    geojson,
    visitorDict,
    playing,
    frameInterval,
    baseInterval,
    calculatedMaxVisitors,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <DeckGL initialViewState={{ ...INITIAL_VIEW_STATE, zoom: initialZoom }} controller={true} layers={layers}>
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
        {/* Slider & Controls */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: '50%',
            background: 'rgba(255,255,255,0.9)',
            padding: 10,
            borderRadius: 8,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <button onClick={playPause}>{playing ? 'Pause' : 'Play'}</button>
          <input
            type='range'
            min={0}
            max={visitorDataTimeseries.length - 1}
            value={frame}
            onChange={handleSliderChange}
            style={{ width: 200, marginLeft: 10 }}
          />
          <span style={{ marginLeft: 10 }}>
            {frame + 1}/{visitorDataTimeseries.length}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              className='flex flex-row gap-2'
              style={{
                marginLeft: 15,
                padding: '5px 10px',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              <Image
                alt='Playback speed'
                src='/playback-speed-icon.svg'
                width={32}
                height={32}
                className='h-8 w-8'
              />
              <span className='my-auto'>Speed: x{intervalMultiplier}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25].map((speed) => (
                <DropdownMenuItem key={speed} onClick={() => setIntervalMultiplier(speed)}>
                  {`x${speed}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tooltip */}
        {containerRef && <DeckGLStickyTooltip containerRef={containerRef} />}
      </DeckGL>
    </div>
  );
}
