'use client';

import { CountriesLayer, type GeoJsonAnimation } from '@/components/map/deckgl/CountriesLayer';
import { LinearInterpolator } from '@deck.gl/core';
import { DeckGL } from '@deck.gl/react';
import { FeatureCollection } from 'geojson';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { DeckGLPopup } from './DeckGLPopup';
import { ZoomControls } from './controls/ZoomControls';
import { ZoomType } from './controls/ZoomButton';

export interface DeckGLMapProps {
  visitorData: {
    [k: string]: number;
  };
  style: DeckGLMapStyle;
  frame?: number;
  fillAnimation?: GeoJsonAnimation;
  outlineAnimation?: GeoJsonAnimation;
  onClick: (info: any) => void;
  onHover: (info: any) => void;
}

const INITIAL_ZOOM_STATE = {
  transitionDuration: 250, // zoom speed
  transitionInterpolator: new LinearInterpolator(['zoom']),
  zoom: 1.5,
};

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  pitch: 0,
  bearing: 0,
  ...INITIAL_ZOOM_STATE,
};

export default function DeckGLClient({
  visitorData,
  outlineAnimation,
  fillAnimation,
  style,
  frame = -1,
  onClick,
  onHover,
}: DeckGLMapProps) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);

  const [viewState, setViewState] = useState({
    ...INITIAL_VIEW_STATE,
  } as any);

  const handleZoom = useCallback((zoomType: ZoomType) => {
    setViewState((vs: any) => {
      const zoom = Math.max(0, Math.min(20, vs.zoom + (zoomType === 'in' ? 1 : -1)));
      return {
        ...vs,
        zoom,
        transitionDuration: 300, // zoom speed
        // transitionInterpolator: new LinearInterpolator(['zoom']),
      };
    });
  }, []);

  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  const layers = CountriesLayer({
    geojson,
    visitorData,
    frame,
    fillAnimation,
    outlineAnimation,
    style,
  });

  const deckRef = useRef<any>(null);

  return (
    <>
      <div className='pointer-events-auto absolute top-3 left-[17rem] z-12'>
        <ZoomControls onZoom={handleZoom} />
      </div>
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        controller={{ doubleClickZoom: false, dragRotate: false }}
        onViewStateChange={({ viewState }) => {
          setViewState(viewState);
        }}
        onClick={onClick}
        onHover={onHover}
        useDevicePixels={false} /* Disable for performance gains */
        layers={layers}
        style={{ position: 'fixed' }}
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
      {viewState && <DeckGLPopup viewState={viewState} />}
    </>
  );
}
