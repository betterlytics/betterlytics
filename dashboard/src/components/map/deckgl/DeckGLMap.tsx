'use client';

import { useMapViewState, useSetMapViewState } from '@/contexts/DeckGLViewStateProvider';
import { useCountriesLayer, type GeoJsonAnimation } from '@/hooks/deckgl/use-countries-layer';
import { DeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { DeckGL } from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
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

  const view = new MapView({
    id: 'main',
    controller: { doubleClickZoom: false, dragRotate: false },
    repeat: false,
  });

  return (
    <>
      <DeckGL
        views={view}
        ref={deckRef}
        viewState={viewState}
        onViewStateChange={({ viewState: vs, interactionState }) => {
          // Only update if user is interacting
          if (!interactionState.inTransition || interactionState.isZooming) {
            setViewState(vs);
          }
        }}
        onClick={onClick}
        onHover={onHover}
        useDevicePixels={true} /* Disable for performance gains */
        layers={layers}
        style={{ position: 'fixed' }}
      >
        {/* TODO: CLean up */}
      </DeckGL>
    </>
  );
}
