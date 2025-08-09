'use client';

import { GeoVisitor } from '@/entities/geography';
import { MapStyle } from '@/hooks/use-leaflet-style';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { createContext, useCallback, useContext } from 'react';

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

type MapSelectionContextType = {
  hoveredFeature: MapFeatureVisitor | undefined;
  clickedFeature: MapFeatureVisitor | undefined;
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
};

type MapSelectionProps = { children: React.ReactNode; style: MapStyle };
type MapFeatureSelection = {
  hovered: MapFeatureVisitor | undefined;
  clicked: MapFeatureVisitor | undefined;
};

const MapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined);

export function useMapSelection() {
  const context = useContext(MapSelectionContext);
  if (!context) {
    throw new Error('useMapSelection must be used within a MapSelectionContextProvider');
  }
  return context;
}

export function MapSelectionContextProvider({ children, style }: MapSelectionProps) {
  const [combined, setCombined] = React.useState({
    clicked: undefined,
    hovered: undefined,
  } as MapFeatureSelection);

  const isMobile = useIsMobile();

  console.log('[MapSelection Wrapper] isMobile: ', isMobile);

  const setMapSelection = useCallback(
    (next: Partial<MapFeatureSelection> | null) => {
      setCombined((prev) => {
        console.log('[MapSelection Callback] isMobile: ', isMobile);
        if (next === null) {
          prev.clicked?.layer.closePopup();
          prev.clicked?.layer.setStyle(style.originalStyle(prev.clicked.geoVisitor.visitors));
          prev.hovered?.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
          return { clicked: undefined, hovered: undefined };
        }

        if (next.clicked) {
          if (next.clicked.geoVisitor.country_code !== prev.clicked?.geoVisitor.country_code) {
            prev.hovered?.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
          } else {
            next.clicked.layer.closePopup();
            next.clicked.layer.setStyle(
              isMobile
                ? style.originalStyle(next.clicked.geoVisitor.visitors)
                : style.hoveredStyle(next.clicked.geoVisitor.visitors),
            );
            return {
              clicked: undefined,
              hovered: { ...next.clicked },
            };
          }

          prev?.clicked?.layer.setStyle(style.originalStyle(prev.clicked.geoVisitor.visitors));
          next.clicked?.layer.setStyle(style.selectedStyle(next.clicked.geoVisitor.visitors));
          next.clicked.layer.bringToFront();
          return { ...prev, ...next };
        }

        if (prev.clicked || prev.hovered?.geoVisitor.country_code === next.hovered?.geoVisitor.country_code) {
          return { ...prev };
        }

        prev.hovered?.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
        next.hovered?.layer.setStyle(style.hoveredStyle(next.hovered.geoVisitor.visitors));
        next.hovered?.layer.bringToFront();

        return { ...prev, ...next };
      });
    },
    [style],
  );

  return (
    <MapSelectionContext.Provider
      value={{
        hoveredFeature: combined.hovered,
        clickedFeature: combined.clicked,
        setMapSelection,
      }}
    >
      {children}
    </MapSelectionContext.Provider>
  );
}
