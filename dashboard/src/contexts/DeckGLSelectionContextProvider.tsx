'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import type { GeoVisitor } from '@/entities/geography';

export type GeoVisitorComparison = {
  compareVisitors?: number;
  compareDate?: Date;
  dAbs?: number; // visitors - compareVisitors
  dProcent?: number; // (dAbs / compareVisitors) * 100
};

export type GeoVisitorWithCompare = GeoVisitor & {
  compare: GeoVisitorComparison;
  date?: Date;
};

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitorWithCompare;
  longitude?: number;
  latitude?: number;
};

type ActionsCtx = {
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
  updateClickedVisitors: (visitors: number, date?: Date, compareVisitors?: number, compareDate?: Date) => void;
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

  const updateClickedVisitors = useCallback(
    (visitors: number, date?: Date, compareVisitors?: number, compareDate?: Date) => {
      setClicked((prev) => {
        if (!prev) return prev;

        const dAbs = typeof compareVisitors === 'number' ? visitors - compareVisitors : undefined;
        const dProcent =
          typeof compareVisitors === 'number' && compareVisitors !== 0
            ? (dAbs! / compareVisitors) * 100
            : undefined;

        const updated: MapFeatureVisitor = {
          ...prev,
          geoVisitor: {
            ...prev.geoVisitor,
            date,
            visitors,
            compare: {
              dAbs,
              dProcent,
              compareVisitors,
              compareDate,
            },
          },
        };

        return (clickedFeatureRef.current = updated);
      });
    },
    [],
  );

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
