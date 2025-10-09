'use client';

import { LinearInterpolator, type MapViewState } from '@deck.gl/core';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';

export const INITIAL_ZOOM_STATE = {
  transitionDuration: 250,
  transitionInterpolator: new LinearInterpolator(['zoom']),
  zoom: 1.5,
  __source: 'deckgl',
} as const;

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 20,
  pitch: 0,
  bearing: 0,
  ...INITIAL_ZOOM_STATE,
} as const;

export type MapViewStateContextType = {
  viewState: MapViewState;
};

export type MapViewActionContextType = Dispatch<SetStateAction<Partial<MapViewState>>>;

const MapViewStateContext = createContext<MapViewStateContextType | undefined>(undefined);
const MapViewActionContext = createContext<MapViewActionContextType | undefined>(undefined);

type MapViewStateProviderProps = {
  children: ReactNode;
};

export function DeckGLMapViewStateProvider({ children }: MapViewStateProviderProps) {
  const [viewState, _setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  const setViewState: MapViewActionContextType = useCallback((update) => {
    _setViewState((prev) => {
      const nextUpdate = typeof update === 'function' ? update(prev) : update;

      return {
        ...INITIAL_VIEW_STATE,
        ...prev,
        ...nextUpdate,
      };
    });
  }, []);

  return (
    <MapViewStateContext.Provider value={{ viewState }}>
      <MapViewActionContext.Provider value={setViewState}>{children}</MapViewActionContext.Provider>
    </MapViewStateContext.Provider>
  );
}

// Hook to read viewState
export function useMapViewState() {
  const context = useContext(MapViewStateContext);
  if (!context) {
    throw new Error('useMapViewState must be used within a DeckGLMapViewStateProvider');
  }
  return context.viewState;
}

// Hook to update viewState (partial updates only)
export function useSetMapViewState() {
  const context = useContext(MapViewActionContext);
  if (!context) {
    throw new Error('useSetMapViewState must be used within a DeckGLMapViewStateProvider');
  }
  return context;
}
