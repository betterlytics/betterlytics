'use client';

import { DeckGL } from '@deck.gl/react';
import { FeatureCollection } from 'geojson';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DeckGLStickyTooltip from '@/components/map/deckgl/DeckGLStickyTooltip';
import { CountriesLayer } from '@/components/map/deckgl/CountriesLayer';
import { MapActionbar } from '@/components/map/deckgl/controls/MapPlayActionbar';
import { usePlayback } from '@/hooks/deckgl/use-playback';
import { PlaybackSpeed } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { type GeoVisitor } from '@/entities/geography';
import { ZoomButton, ZoomType } from '@/components/map/deckgl/controls/ZoomButton';
import { DeckGLPopup } from '@/components/map/deckgl/DeckGLPopup';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';
import { LinearInterpolator } from '@deck.gl/core';

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
  const { hoveredFeatureRef, setMapSelection } = useMapSelection();

  // ---- Demo timeseries
  const visitorDataTimeseries: GeoVisitor[][] = useMemo(() => {
    console.log('[Memo] visitorDataTimeseries recomputed');
    return Array.from({ length: 40 }).map((_, i) =>
      visitorData.map((d) => ({
        country_code: d.country_code,
        visitors: Math.max(0, Math.round(d.visitors * (0.5 + 0.5 * Math.sin((i / 40) * Math.PI * 2)))),
      })),
    );
  }, [visitorData]);

  const calculatedMaxVisitors = useMemo(() => {
    console.log('[Memo] calculatedMaxVisitors recomputed');
    return Math.max(...visitorDataTimeseries.flatMap((frame) => frame.map((d) => d.visitors)));
  }, [visitorDataTimeseries]);

  const [speed, setSpeed] = useState(1 as PlaybackSpeed);
  const [viewState, setViewState] = useState({
    ...INITIAL_VIEW_STATE,
    zoom: initialZoom,
  } as any);

  const { position, frame, playing, toggle, stop, scrub } = usePlayback({
    frameCount: visitorDataTimeseries.length,
    speed,
  });

  useEffect(() => {
    //! TODO: Update more gracefully
    setMapSelection(null);
  }, [playing, frame]);

  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  const visitorDict = useMemo(() => {
    console.log('[Memo] visitorDict recomputed for frame', frame);
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  const handleZoom = useCallback((zoomType: ZoomType) => {
    setViewState((vs: any) => {
      const newZoom = Math.max(0, Math.min(20, vs.zoom + (zoomType === 'in' ? 1 : -1)));

      return {
        ...vs,
        zoom: newZoom,
        transitionDuration: 250,
        transitionInterpolator: new LinearInterpolator(['zoom']),
      };
    });
  }, []);

  const handleClick = useCallback(
    (info: any) => {
      if (info.object && !playing) {
        setMapSelection({
          clicked: {
            longitude: info?.coordinate?.[0],
            latitude: info?.coordinate?.[1],
            geoVisitor: {
              country_code: info.object.id as string,
              visitors: visitorDict[info.object.id] ?? 0,
            },
          },
        });
      } else {
        setMapSelection(null);
      }
    },
    [visitorDict, setMapSelection, playing],
  );

  const handleHover = useCallback(
    (info: any) => {
      const hoveredCountryCode = info.object?.id as string | undefined;
      const prevHoveredCountryCode = hoveredFeatureRef?.current?.geoVisitor.country_code;

      if (hoveredCountryCode === prevHoveredCountryCode || playing) return;

      if (hoveredCountryCode) {
        setMapSelection({
          hovered: {
            geoVisitor: {
              country_code: hoveredCountryCode,
              visitors: visitorDict[hoveredCountryCode] ?? 0,
            },
          },
        });
      } else {
        setMapSelection({ hovered: undefined });
      }
    },
    [visitorDict, setMapSelection, hoveredFeatureRef, playing],
  );

  const layers = CountriesLayer({
    geojson,
    visitorDict,
    playing,
    frameInterval: 1000 / speed,
    baseInterval: 1000,
    calculatedMaxVisitors,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <DeckGL
        viewState={viewState}
        controller={{ doubleClickZoom: false, dragRotate: false }}
        onViewStateChange={({ viewState }) => {
          setViewState(viewState);
        }}
        onClick={handleClick}
        onHover={handleHover}
        useDevicePixels={false} /* Disable for performance gains */
        layers={layers}
      >
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
      </DeckGL>

      <div className='pointer-events-auto absolute bottom-10 left-[17rem] z-12 w-[calc(100%-20rem)]'>
        <MapActionbar
          ticks={visitorDataTimeseries.map((_, i) => ({ label: `${i + 1}`, value: i }))}
          value={position}
          playing={playing}
          speed={speed}
          onTogglePlay={toggle}
          onStop={stop}
          onScrub={scrub}
          onChangeSpeed={setSpeed}
        />
      </div>

      <div className='pointer-events-auto absolute top-3 left-[17rem] z-12 flex flex-col'>
        <ZoomButton
          key={'in'}
          className={'border-b-border border-b-[0.5px]'}
          onClick={() => handleZoom('in')}
          zoomType={'in'}
        />
        <ZoomButton key={'out'} onClick={() => handleZoom('out')} zoomType={'out'} />
      </div>

      {containerRef && <DeckGLStickyTooltip containerRef={containerRef} />}
      {viewState && <DeckGLPopup viewState={viewState} />}
    </div>
  );
}
