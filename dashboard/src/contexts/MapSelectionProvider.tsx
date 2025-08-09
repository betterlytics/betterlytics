'use client';

import { GeoVisitor } from '@/entities/geography';
import { LeafletStyle } from '@/hooks/leaflet/use-leaflet-style';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { createContext, useContext, useState, Dispatch, SetStateAction, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet/hooks';

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

type MapSelectionContextType = {
  hoveredFeature: MapFeatureVisitor | undefined;
  selectedFeature: MapFeatureVisitor | undefined;
  setFeatures: React.Dispatch<Partial<Hello> | null>;
};

const MapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined);

export function useMapSelection() {
  const context = useContext(MapSelectionContext);
  if (!context) {
    throw new Error('useMapSelection must be used within a MapSelectionContextProvider');
  }
  return context;
}

type Props = { children: React.ReactNode; style: LeafletStyle };

type Hello = { hovered: MapFeatureVisitor | undefined; selected: MapFeatureVisitor | undefined };

export function MapSelectionContextProvider({ children, style }: Props) {
  const [combined, setCombined] = React.useState({ selected: undefined, hovered: undefined } as Hello);
  const isMobile = useIsMobile();

  const setFeatures = useCallback(
    (next: Partial<Hello> | null) => {
      setCombined((prev) => {
        if (next === null) {
          prev.selected?.layer.closePopup();
          prev.selected?.layer.setStyle(style.originalStyle(prev.selected.geoVisitor.visitors));
          prev.hovered?.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
          return { selected: undefined, hovered: undefined };
        }

        if (next.selected) {
          if (next.selected.geoVisitor.country_code !== prev.selected?.geoVisitor.country_code) {
            prev.hovered?.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
          } else {
            next.selected.layer.closePopup();
            next.selected.layer.setStyle(
              isMobile
                ? style.originalStyle(next.selected.geoVisitor.visitors)
                : style.hoveredStyle(next.selected.geoVisitor.visitors),
            );
            return {
              selected: undefined,
              hovered: { ...next.selected },
            };
          }

          prev?.selected?.layer.setStyle(style.originalStyle(prev.selected.geoVisitor.visitors));
          next.selected?.layer.setStyle(style.selectedStyle(next.selected.geoVisitor.visitors));
          next.selected.layer.bringToFront();
          return { ...prev, ...next };
        }

        if (prev.selected || prev.hovered?.geoVisitor.country_code === next.hovered?.geoVisitor.country_code) {
          return { ...prev };
        }

        prev.hovered?.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
        next.hovered?.layer.setStyle(style.hoveredStyle(next.hovered.geoVisitor.visitors));
        next.hovered?.layer.bringToFront();

        return { ...prev, ...next };
      });
    },
    [combined, isMobile],
  );

  return (
    <MapSelectionContext.Provider
      value={{
        hoveredFeature: combined.hovered,
        selectedFeature: combined.selected,
        setFeatures,
      }}
    >
      {children}
    </MapSelectionContext.Provider>
  );
}
