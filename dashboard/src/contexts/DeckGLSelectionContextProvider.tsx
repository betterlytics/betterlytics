'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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

interface MapSelectionContextType {
  hoveredFeature?: MapFeatureVisitor;
  clickedFeature?: MapFeatureVisitor;
  hoveredFeatureRef?: React.RefObject<MapFeatureVisitor | undefined>;
  clickedFeatureRef?: React.RefObject<MapFeatureVisitor | undefined>;
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
}

const DeckGLMapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined);

export function useMapSelection(): MapSelectionContextType {
  const ctx = useContext(DeckGLMapSelectionContext);
  if (!ctx) throw new Error('useMapSelection must be used within DeckGLMapSelectionContextProvider');
  return ctx;
}

export function DeckGLMapSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<MapFeatureSelection>({});

  const hoveredFeatureRef = React.useRef<MapFeatureVisitor | undefined>(undefined);
  const clickedFeatureRef = React.useRef<MapFeatureVisitor | undefined>(undefined);

  const setMapSelection = useCallback<React.Dispatch<Partial<MapFeatureSelection> | null>>((next) => {
    setSelection((prev) => {
      if (next === null) {
        clickedFeatureRef.current = undefined;
        hoveredFeatureRef.current = undefined;
        return { clicked: undefined, hovered: undefined };
      }

      if (next.clicked) {
        const same = next.clicked.geoVisitor.country_code === prev.clicked?.geoVisitor.country_code;
        if (same) {
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

  return (
    <DeckGLMapSelectionContext.Provider
      value={{
        hoveredFeature: selection.hovered,
        clickedFeature: selection.clicked,
        hoveredFeatureRef,
        clickedFeatureRef,
        setMapSelection,
      }}
    >
      {children}
    </DeckGLMapSelectionContext.Provider>
  );
}
