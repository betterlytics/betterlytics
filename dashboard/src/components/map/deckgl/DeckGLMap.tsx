'use client';

import { useMapSubscriptions } from '@/contexts/DeckGLMapContext';
import { useCountriesLayer, type GeoJsonAnimation } from '@/hooks/deckgl/use-countries-layer';
import { DeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { INITIAL_VIEW_STATE } from '@/types/deckgl-viewtypes';
import { MapView, type MapViewState } from '@deck.gl/core';
import { DeckGL } from '@deck.gl/react';
import { FeatureCollection } from 'geojson';
import { useEffect, useRef, useState } from 'react';
import { DeckGLPopup } from './DeckGLPopup';

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
  const [viewState, setViewState] = useState<MapViewState>({ ...INITIAL_VIEW_STATE });

  useMapSubscriptions(setViewState); // Subscribe to viewstate updates

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
          //! TODO: Add bounds
          setViewState(vs);
        }}
        onClick={onClick}
        onHover={onHover}
        useDevicePixels={true} /* Disable for performance gains */
        layers={layers}
        style={{ position: 'fixed' }}
      />
      <DeckGLPopup viewState={viewState} />
    </>
  );
}
