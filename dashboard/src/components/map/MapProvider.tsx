'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Map as LeafletMapInstance } from 'leaflet';

export type MapScope = {
  map: LeafletMapInstance | null;
  setMap: (map: LeafletMapInstance | null) => void;
};

const MapContext = createContext<MapScope | null>(null);

/** Lets map controls rendered outside LeafletMap (for example in a page toolbar) attach to the map instance; one map per provider */
export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<LeafletMapInstance | null>(null);
  const scope = useMemo(() => ({ map, setMap }), [map]);
  return <MapContext.Provider value={scope}>{children}</MapContext.Provider>;
}

export function useMapScope(): MapScope | null {
  return useContext(MapContext);
}

export function useMapInstance(): LeafletMapInstance | null {
  const scope = useMapScope();
  if (!scope) {
    throw new Error('useMapInstance must be used within MapProvider or as LeafletMap controls');
  }
  return scope.map;
}

export function MapScopeProvider({ scope, children }: { scope: MapScope; children: ReactNode }) {
  return <MapContext.Provider value={scope}>{children}</MapContext.Provider>;
}
