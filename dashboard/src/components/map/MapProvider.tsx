'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Map as LeafletMapInstance } from 'leaflet';

export type MapScope = {
  map: LeafletMapInstance | null;
  setMap: (map: LeafletMapInstance | null) => void;
};

export const MapContext = createContext<MapScope | null>(null);

// Attaches controls rendered outside LeafletMap to its instance, one map per provider
export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMapState] = useState<LeafletMapInstance | null>(null);
  const registered = useRef<LeafletMapInstance | null>(null);

  const setMap = useCallback((next: LeafletMapInstance | null) => {
    if (next && registered.current && registered.current !== next) {
      throw new Error('MapProvider already holds a map; wrap the second LeafletMap in its own MapProvider');
    }
    registered.current = next;
    setMapState(next);
  }, []);

  const scope = useMemo(() => ({ map, setMap }), [map, setMap]);
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
