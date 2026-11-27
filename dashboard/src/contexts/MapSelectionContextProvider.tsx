'use client';

import { largestRingCenter } from '@/components/map/feature-anchor';
import { planConvergence } from '@/components/map/selection-convergence';
import type { GeoFeatureDisplay } from '@/components/map/types';
import type { GeoFeatureVisitorWithCompare } from '@/entities/analytics/geography.entities';
import { MapStyle } from '@/hooks/use-leaflet-style';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type MapFeatureVisitor = {
  geoVisitor: GeoFeatureVisitorWithCompare;
  layer: L.Polygon;
  display: GeoFeatureDisplay;
  mousePosition?: { x: number; y: number };
};

type MapSelectionStateContextType = {
  hoveredFeature: MapFeatureVisitor | undefined;
  clickedFeature: MapFeatureVisitor | undefined;
};

type MapSelectionSetterContextType = {
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
  registerFeature: (code: string, entry: MapFeatureVisitor | null) => void;
  markLayersReady: () => void;
};

type MapSelectionProps = { children: React.ReactNode; style: MapStyle; selectedFeatureId?: string | null };
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

export function MapSelectionContextProvider({ children, style, selectedFeatureId }: MapSelectionProps) {
  const [combined, setCombined] = React.useState({
    clicked: undefined,
    hovered: undefined,
  } as MapFeatureSelection);
  const featuresRef = useRef(new Map<string, MapFeatureVisitor>());
  const [layersVersion, setLayersVersion] = useState(0);

  const isMobile = useIsMobile();

  const registerFeature = useCallback((code: string, entry: MapFeatureVisitor | null) => {
    if (entry) featuresRef.current.set(code, entry);
    else featuresRef.current.delete(code);
  }, []);

  const markLayersReady = useCallback(() => setLayersVersion((v) => v + 1), []);

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
          if (next.clicked.geoVisitor.code !== prev.clicked?.geoVisitor.code) {
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

        if (!prev.hovered && !next.hovered) {
          return prev;
        }

        if (prev.hovered?.geoVisitor.code === next.hovered?.geoVisitor.code) {
          return { ...prev };
        }

        if (prev.hovered && prev.hovered.geoVisitor.code !== prev.clicked?.geoVisitor.code) {
          prev.hovered.layer.setStyle(style.originalStyle(prev.hovered.geoVisitor.visitors));
        }

        if (!prev.clicked || next.hovered?.geoVisitor.code !== prev.clicked.geoVisitor.code) {
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

  useEffect(() => {
    const clicked = combined.clicked;
    const entry = selectedFeatureId ? featuresRef.current.get(selectedFeatureId) : undefined;
    const step = planConvergence(selectedFeatureId, clicked?.layer, entry?.layer, layersVersion > 0);
    if (step === 'clear') setMapSelection(null);
    if (step === 'select' && entry) {
      if (clicked) setMapSelection(null);
      setMapSelection({ clicked: entry });
    }
    if (entry && step !== 'ignore' && !entry.layer.isPopupOpen()) {
      entry.layer.openPopup(largestRingCenter(entry.layer));
    }
  }, [selectedFeatureId, layersVersion, combined.clicked, setMapSelection]);

  const stateValue = React.useMemo(
    () => ({
      hoveredFeature: combined.hovered,
      clickedFeature: combined.clicked,
    }),
    [combined.hovered, combined.clicked],
  );

  const setterValue = React.useMemo(
    () => ({ setMapSelection, registerFeature, markLayersReady }),
    [setMapSelection, registerFeature, markLayersReady],
  );

  return (
    <MapSelectionSetterContext.Provider value={setterValue}>
      <MapSelectionStateContext.Provider value={stateValue}>{children}</MapSelectionStateContext.Provider>
    </MapSelectionSetterContext.Provider>
  );
}
