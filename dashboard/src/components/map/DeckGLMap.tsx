'use client';

import { useEffect, useState, useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import { scaleLinear } from 'd3-scale';
import { color as d3color } from 'd3-color';
import { MAP_VISITOR_COLORS } from '@/constants/mapColors';

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
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  const visitorDataTimeseries: GeoVisitor[][] = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) =>
      visitorData.map((d) => ({
        country_code: d.country_code,
        // add small variation per frame for animation
        visitors: Math.max(0, Math.round(d.visitors * (0.5 + 0.5 * Math.sin((i / 40) * Math.PI * 2)))),
      })),
    );
  }, [visitorData]);

  // const { colorScale } = useMapStyle({ calculatedMaxVisitors: maxVisitors });
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1, Math.max(...visitorData.map((d) => d.visitors))])
        .range([
          MAP_VISITOR_COLORS.NO_VISITORS,
          MAP_VISITOR_COLORS.LOW_VISITORS,
          MAP_VISITOR_COLORS.HIGH_VISITORS,
        ]),
    [visitorData],
  );

  const getFillColor = (visitors: number): [number, number, number, number] => {
    const c = d3color(colorScale(visitors))!;
    return [c.r, c.g, c.b, 200]; // tuple with fixed length
  };

  // load geojson
  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data));
  }, []);

  // play animation
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % visitorDataTimeseries.length);
    }, 500);
    return () => clearInterval(interval);
  }, [playing, visitorDataTimeseries.length]);

  // prepare current visitor lookup
  const visitorDict = useMemo(() => {
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  // calculate max visitors for color scale

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
      updateTriggers: {
        getFillColor: visitorDict, // re-run getFillColor whenever visitorDict changes
      },
    });

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <DeckGL
        initialViewState={{ ...INITIAL_VIEW_STATE, zoom: initialZoom }}
        controller={true}
        layers={layer ? [layer] : []}
      >
        {/* Slider + play/pause UI */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            left: '50%',
            background: 'rgba(255,255,255,0.9)',
            padding: 10,
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <button onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
          <input
            type='range'
            min={0}
            max={visitorDataTimeseries.length - 1}
            value={frame}
            onChange={(e) => setFrame(Number(e.target.value))}
            style={{ width: 200, marginLeft: 10 }}
          />
          <span style={{ marginLeft: 10 }}>
            {frame + 1}/{visitorDataTimeseries.length}
          </span>
        </div>
      </DeckGL>
    </div>
  );
}
