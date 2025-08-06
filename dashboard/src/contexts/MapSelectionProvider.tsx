'use client';

import { GeoVisitor } from '@/entities/geography';
import { LeafletStyle } from '@/hooks/leaflet/use-leaflet-style';
import React, { createContext, useContext, useState, Dispatch, SetStateAction, useMemo, useCallback } from 'react';

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

type MapSelectionContextType = {
  hoveredFeature: MapFeatureVisitor | undefined;
  selectedFeature: MapFeatureVisitor | undefined;
  setHoveredFeature: (newFeature: MapFeatureVisitor | undefined) => void;
  setSelectedFeature: (newFeature: MapFeatureVisitor | undefined) => void;
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

export function MapSelectionContextProvider({ children, style }: Props) {
  const [hovered, setHovered] = React.useState<MapFeatureVisitor | undefined>(undefined);
  const [selected, setSelected] = React.useState<MapFeatureVisitor | undefined>(undefined);

  const setHoveredFeature = (newFeature: MapFeatureVisitor | undefined) => {
    setHovered((prevHovered) => {
      console.log(
        `[Hover Update] new:${newFeature?.geoVisitor.country_code} --- old:${prevHovered?.geoVisitor.country_code}`,
      );
      if (prevHovered && prevHovered.geoVisitor.country_code !== selected?.geoVisitor.country_code) {
        prevHovered.layer.bringToBack();
        prevHovered.layer.setStyle(style.originalStyle(prevHovered.geoVisitor.visitors));
      }

      if (newFeature && newFeature.geoVisitor.country_code !== selected?.geoVisitor.country_code) {
        newFeature.layer.bringToFront();
        newFeature.layer.setStyle(style.hoveredStyle(newFeature.geoVisitor.visitors));
      }

      return newFeature;
    });
  };

  const setSelectedFeature = React.useCallback(
    (newFeature: MapFeatureVisitor | undefined) => {
      setSelected((prevSelected) => {
        if (prevSelected) {
          prevSelected.layer.bringToBack();
          prevSelected.layer.setStyle(style.originalStyle(prevSelected.geoVisitor.visitors));
        }
        if (newFeature) {
          newFeature.layer.bringToFront();
          newFeature.layer.setStyle(style.hoveredStyle(newFeature.geoVisitor.visitors));
        }
        return newFeature;
      });
    },
    [style],
  );

  return (
    <MapSelectionContext.Provider
      value={{
        hoveredFeature: hovered,
        selectedFeature: selected,
        setHoveredFeature,
        setSelectedFeature,
      }}
    >
      {children}
    </MapSelectionContext.Provider>
  );
}
