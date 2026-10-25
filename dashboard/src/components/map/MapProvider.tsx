'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Map as LeafletMapInstance } from 'leaflet';

export type MapScope = {
  map: LeafletMapInstance | null;
  setMap: (map: LeafletMapInstance | null) => void;
};

export const MapContext = createContext<MapScope | null>(null);

// Attaches controls rendered outside LeafletMap to its instance, one map per provider
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
