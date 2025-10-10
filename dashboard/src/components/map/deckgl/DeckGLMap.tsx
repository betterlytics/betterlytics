'use client';

import { useMapViewState, useSetMapViewState } from '@/contexts/DeckGLViewStateProvider';
import { useCountriesLayer, type GeoJsonAnimation } from '@/hooks/deckgl/use-countries-layer';
import { DeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { DeckGL } from '@deck.gl/react';
import { FeatureCollection } from 'geojson';
import { useEffect, useRef, useState } from 'react';

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
  const viewState = useMapViewState();
  const setViewState = useSetMapViewState();

  useEffect(() => {
    fetch('/data/countries.geo.json')
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error('Error loading geojson:', err));
  }, []);

  const layers = useCountriesLayer({
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
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        controller={{ doubleClickZoom: false, dragRotate: false }}
        onViewStateChange={({ viewState: vs, interactionState }) => {
          // Only update if user is interacting
          if (!interactionState.inTransition || interactionState.isZooming) {
            setViewState(vs);
          }
        }}
        onClick={onClick}
        onHover={onHover}
        useDevicePixels={false} /* Disable for performance gains */
        layers={layers}
        style={{ position: 'fixed' }}
      >
        {/* TODO: CLean up */}
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
    </>
  );
}
