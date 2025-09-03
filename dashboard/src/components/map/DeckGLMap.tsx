'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { scaleLinear } from 'd3-scale';
import { color as d3color } from 'd3-color';
import { MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { FeatureCollection } from 'geojson';
import Image from 'next/image';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'; // Adjust the import path if needed

type GeoVisitor = {
  country_code: string;
  visitors: number;
};

interface DeckGLMapProps {
  visitorData: GeoVisitor[]; // [frame][country]
  maxVisitors: number;
  initialZoom?: number;
}

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
};

export default function DeckGLMap({ visitorData, maxVisitors, initialZoom = 1.5 }: DeckGLMapProps) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [playing, setPlaying] = useState(false);
  const [intervalMultiplier, setIntervalMultiplier] = useState(1); // State for controlling play speed
  const [frame, setFrameState] = useState(0); // State that triggers re-render of UI

  const frameRef = useRef(0); // Ref to store the actual current frame (no re-render)

  // Simulating dynamic time-series data for visitors
  const visitorDataTimeseries: GeoVisitor[][] = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) =>
      visitorData.map((d) => ({
        country_code: d.country_code,
        visitors: Math.max(0, Math.round(d.visitors * (0.5 + 0.5 * Math.sin((i / 40) * Math.PI * 2)))),
      })),
    );
  }, [visitorData]);

  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1, Math.max(...visitorData.map((d) => d.visitors))]) // No need for 1, just 0 and max visitors
        .range([
          MAP_VISITOR_COLORS.NO_VISITORS,
          MAP_VISITOR_COLORS.LOW_VISITORS,
          MAP_VISITOR_COLORS.HIGH_VISITORS,
        ]),
    [visitorData],
  );

  const getFillColor = (visitors: number): [number, number, number, number] => {
    const c = d3color(colorScale(visitors))!;
    return [c.r, c.g, c.b, 200]; // Tuple with fixed length
  };

  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  const baseInterval = 1000;
  const frameInterval = baseInterval / intervalMultiplier; // Adjust frame interval dynamically based on multiplier

  // Play/Pause Handler
  const playPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  // Manual frame setter (for when the slider changes)
  const setFrame = useCallback(
    (newFrame: number) => {
      frameRef.current = Math.max(0, Math.min(visitorDataTimeseries.length - 1, newFrame)); // Clamp to valid range
      setFrameState(frameRef.current); // Trigger re-render for UI update
    },
    [visitorDataTimeseries],
  );

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % visitorDataTimeseries.length; // Update the frame
      setFrameState(frameRef.current); // Trigger re-render with the new frame
    }, frameInterval);
    return () => clearInterval(interval);
  }, [playing, visitorDataTimeseries.length, frameInterval]);

  const visitorDict = useMemo(() => {
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  const layer =
    geojson &&
    new GeoJsonLayer({
      id: 'choropleth',
      data: geojson,
      filled: true,
      stroked: true,
      getFillColor: (f) => {
        const iso = f.id as string;
        const v = visitorDict[iso] ?? 0;
        return getFillColor(v);
      },
      getLineColor: [80, 80, 80],
      lineWidthMinPixels: 0.5,
      transitions: {
        getFillColor: {
          duration: playing ? frameInterval : baseInterval / 5, // Use the frame interval if playing
          easing: (t: any) => t * t, // EaseInOutQuad for smoothness
        },
      },

      updateTriggers: {
        getFillColor: visitorDict, // Re-run getFillColor whenever visitorDict changes
      },
    });

  // Slider change handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = Number(e.target.value);
    setFrame(newFrame); // Update the frame manually
    setPlaying(false); // Stop playback when the user manually changes the slider
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <DeckGL
        initialViewState={{ ...INITIAL_VIEW_STATE, zoom: initialZoom }}
        controller={true}
        layers={layer ? [layer] : []} // Only render the layer if geojson is available
      >
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

          {/* Dropdown for play speed */}
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
                alt='Playback speed' /** TODO: localize */
                src={'/playback-speed-icon.svg'}
                width={32}
                height={32}
                className='h-8 w-8'
              />
              <span className='my-auto'>Speed: x{intervalMultiplier}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25].map((playbackSpeed) => (
                <DropdownMenuItem key={playbackSpeed} onClick={() => setIntervalMultiplier(playbackSpeed)}>
                  {`x${playbackSpeed}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DeckGL>
    </div>
  );
}
