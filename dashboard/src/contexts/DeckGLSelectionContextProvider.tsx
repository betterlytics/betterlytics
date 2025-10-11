// DeckGLSelectionContextProvider.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

export type GeoVisitor = {
  country_code: string;
  visitors: number;
};

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitor;
  longitude?: number;
  latitude?: number;
};

interface MapFeatureSelection {
  hovered?: MapFeatureVisitor;
  clicked?: MapFeatureVisitor;
}

type StateCtx = {
  hovered?: MapFeatureVisitor;
  clicked?: MapFeatureVisitor;
};

type ActionsCtx = {
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
  hoveredFeatureRef: React.RefObject<MapFeatureVisitor | undefined>;
  clickedFeatureRef: React.RefObject<MapFeatureVisitor | undefined>;
};

const SelectionStateContext = createContext<StateCtx | undefined>(undefined);
const SelectionActionsContext = createContext<ActionsCtx | undefined>(undefined);

export function useMapSelectionState() {
  const ctx = useContext(SelectionStateContext);
  if (!ctx) throw new Error('useSelectionState must be used within DeckGLMapSelectionProvider');
  return ctx;
}
export function useMapSelectionActions() {
  const ctx = useContext(SelectionActionsContext);
  if (!ctx) throw new Error('useSelectionActions must be used within DeckGLMapSelectionProvider');
  return ctx;
}

export function DeckGLMapSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<MapFeatureSelection>({});

  const hoveredFeatureRef = useRef<MapFeatureVisitor | undefined>(undefined);
  const clickedFeatureRef = useRef<MapFeatureVisitor | undefined>(undefined);

  const setMapSelection = useCallback<React.Dispatch<Partial<MapFeatureSelection> | null>>((next) => {
    setSelection((prev) => {
      if (next === null) {
        clickedFeatureRef.current = undefined;
        hoveredFeatureRef.current = undefined;
        return { clicked: undefined, hovered: undefined };
      }

      if (next.clicked) {
        if (next.clicked.geoVisitor.country_code === prev.clicked?.geoVisitor.country_code) {
          clickedFeatureRef.current = undefined;
          hoveredFeatureRef.current = { ...next.clicked };
          return { clicked: undefined, hovered: { ...next.clicked } };
        } else {
          clickedFeatureRef.current = next.clicked;
          hoveredFeatureRef.current = undefined;
          return { clicked: { ...next.clicked }, hovered: undefined };
        }
      }

      if (prev.clicked || prev.hovered?.geoVisitor.country_code === next.hovered?.geoVisitor.country_code) {
        return prev;
      }
      hoveredFeatureRef.current = next.hovered;
      return { ...prev, hovered: next.hovered };
    });
  }, []);

  const stateValue = useMemo(
    () => ({ hovered: selection.hovered, clicked: selection.clicked }),
    [selection.hovered, selection.clicked],
  );

  // depends on stable refs to avoid re-renders
  const actionsValue = useMemo(
    () => ({ setMapSelection, hoveredFeatureRef, clickedFeatureRef }),
    [setMapSelection],
  );

  return (
    <SelectionActionsContext.Provider value={actionsValue}>
      <SelectionStateContext.Provider value={stateValue}>{children}</SelectionStateContext.Provider>
    </SelectionActionsContext.Provider>
  );
}
