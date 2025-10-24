'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import type { GeoVisitor } from '@/entities/geography';

export type GeoVisitorComparison = {
  compare_visitors?: number;
  dAbs?: number; // visitors - compare_visitors
  dProcent?: number; // (dAbs / compare_visitors) * 100
};

export type GeoVisitorWithCompare = GeoVisitor & {
  compare: GeoVisitorComparison;
};

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitorWithCompare;
  longitude?: number;
  latitude?: number;
};

type ActionsCtx = {
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
  updateClickedVisitors: (visitors: number, compare_visitors?: number) => void; // <-- accept compare
  hoveredFeatureRef: React.RefObject<MapFeatureVisitor | undefined>;
  clickedFeatureRef: React.RefObject<MapFeatureVisitor | undefined>;
};

interface MapFeatureSelection {
  hovered?: MapFeatureVisitor;
  clicked?: MapFeatureVisitor;
}

type StateCtx = {
  clicked?: MapFeatureVisitor;
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
  const [clicked, setClicked] = useState<MapFeatureVisitor | undefined>(undefined);

  const hoveredFeatureRef = useRef<MapFeatureVisitor | undefined>(undefined);
  const clickedFeatureRef = useRef<MapFeatureVisitor | undefined>(undefined);

  const setMapSelection = useCallback<React.Dispatch<Partial<MapFeatureSelection> | null>>((next) => {
    if (next === null) {
      hoveredFeatureRef.current = undefined;
      clickedFeatureRef.current = undefined;
      setClicked(undefined);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(next, 'hovered')) {
      hoveredFeatureRef.current = next.hovered;
    }

    if (next.clicked) {
      const incomingCode = next.clicked.geoVisitor.country_code;
      const prevClickedCode = clickedFeatureRef.current?.geoVisitor.country_code;

      if (incomingCode === prevClickedCode) {
        clickedFeatureRef.current = undefined;
        hoveredFeatureRef.current = { ...next.clicked };
        setClicked(undefined);
      } else {
        clickedFeatureRef.current = next.clicked;
        hoveredFeatureRef.current = undefined;
        setClicked(next.clicked);
      }
    }
  }, []);

  const updateClickedVisitors = useCallback((visitors: number, compare_visitors?: number) => {
    setClicked((prev) => {
      if (!prev) return prev;

      const dAbs = typeof compare_visitors === 'number' ? visitors - compare_visitors : undefined;
      const dProcent =
        typeof compare_visitors === 'number' && compare_visitors !== 0
          ? (dAbs! / compare_visitors) * 100
          : undefined;

      const updated: MapFeatureVisitor = {
        ...prev,
        geoVisitor: {
          ...prev.geoVisitor,
          visitors,
          compare: {
            compare_visitors,
            dAbs,
            dProcent,
          },
        },
      };

      return (clickedFeatureRef.current = updated);
    });
  }, []);

  const stateValue = useMemo(() => ({ clicked }), [clicked]);

  const actionsValue = useMemo(
    () => ({
      setMapSelection,
      updateClickedVisitors,
      hoveredFeatureRef,
      clickedFeatureRef,
    }),
    [setMapSelection, updateClickedVisitors],
  );

  return (
    <SelectionActionsContext.Provider value={actionsValue}>
      <SelectionStateContext.Provider value={stateValue}>{children}</SelectionStateContext.Provider>
    </SelectionActionsContext.Provider>
  );
}
