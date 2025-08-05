'use client';

import { GeoVisitor } from '@/entities/geography';
import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';

type MapFeatureVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

type MapSelectionContextType = {
  hoveredFeature: MapFeatureVisitor | undefined;
  selectedFeature: MapFeatureVisitor | undefined;
  setHoveredFeature: Dispatch<SetStateAction<MapFeatureVisitor | undefined>>;
  setSelectedFeature: Dispatch<SetStateAction<MapFeatureVisitor | undefined>>;
};

const MapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined);

export function useMapSelection() {
  const context = useContext(MapSelectionContext);
  if (!context) throw new Error('useMapSelection must be used within a react-leaflet MapContainer');
  return context;
}

type Props = {
  children: React.ReactNode;
};

export function MapSelectionContextProvider({ children }: Props) {
  const [hoveredFeature, setHoveredFeature] = useState<MapFeatureVisitor | undefined>(undefined);
  const [selectedFeature, setSelectedFeature] = useState<MapFeatureVisitor | undefined>(undefined);

  return (
    <MapSelectionContext.Provider
      value={{ hoveredFeature, setHoveredFeature, selectedFeature, setSelectedFeature }}
    >
      {children}
    </MapSelectionContext.Provider>
  );
}
