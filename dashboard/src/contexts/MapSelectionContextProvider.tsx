'use client';

import type { GeoVisitorWithCompare } from '@/entities/geography';
import { MapStyle } from '@/hooks/use-leaflet-style';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { createContext, useCallback, useContext } from 'react';

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitorWithCompare;
  layer: L.Polygon;
  mousePosition?: { x: number; y: number };
};

type MapSelectionStateContextType = {
  hoveredFeature: MapFeatureVisitor | undefined;
  clickedFeature: MapFeatureVisitor | undefined;
};

type MapSelectionSetterContextType = {
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
};

type MapSelectionProps = { children: React.ReactNode; style: MapStyle };
type MapFeatureSelection = {
  hovered: MapFeatureVisitor | undefined;
  clicked: MapFeatureVisitor | undefined;
};

const MapSelectionStateContext = createContext<MapSelectionStateContextType | undefined>(undefined);
const MapSelectionSetterContext = createContext<MapSelectionSetterContextType | undefined>(undefined);

export function useMapSelectionState() {
  const context = useContext(MapSelectionStateContext);
  if (!context) {
    throw new Error('useMapSelectionState must be used within a MapSelectionContextProvider');
  }
  return context;
}

export function useMapSelectionSetter() {
  const context = useContext(MapSelectionSetterContext);
  if (!context) {
    throw new Error('useMapSelectionSetter must be used within a MapSelectionContextProvider');
  }
  return context;
}

export function MapSelectionContextProvider({ children, style }: MapSelectionProps) {
  const [combined, setCombined] = React.useState({
    clicked: undefined,
    hovered: undefined,
  } as MapFeatureSelection);

  const isMobile = useIsMobile();

  /**
   * Updates map selection state and applies corresponding styles.
   * - Clears selection if `null` is passed.
   * - Clicking toggles selection; clicking the same feature again deselects it.
   * - Hover updates only when no feature is clicked.
   */
  const setMapSelection = useCallback(
    (next: Partial<MapFeatureSelection> | null) => {
      setCombined((prev) => {
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

        if (prev.hovered?.geoVisitor.country_code === next.hovered?.geoVisitor.country_code) {
          return { ...prev };
        }

        if (prev.hovered && prev.hovered.geoVisitor.country_code !== prev.clicked?.geoVisitor.country_code) {
          prev.hovered.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
        }

        if (!prev.clicked || next.hovered?.geoVisitor.country_code !== prev.clicked.geoVisitor.country_code) {
          next.hovered?.layer.setStyle(style.hoveredStyle(next.hovered.geoVisitor.visitors));
          next.hovered?.layer.bringToFront();

          if (prev.clicked) {
            prev.clicked.layer.bringToFront();
          }
        }

        return { ...prev, ...next };
      });
    },
    [style, isMobile],
  );

  const stateValue = React.useMemo(
    () => ({
      hoveredFeature: combined.hovered,
      clickedFeature: combined.clicked,
    }),
    [combined.hovered, combined.clicked],
  );

  const setterValue = React.useMemo(
    () => ({
      setMapSelection,
    }),
    [setMapSelection],
  );

  return (
    <MapSelectionSetterContext.Provider value={setterValue}>
      <MapSelectionStateContext.Provider value={stateValue}>{children}</MapSelectionStateContext.Provider>
    </MapSelectionSetterContext.Provider>
  );
}
