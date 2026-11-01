'use client';

import MapBackgroundLayer from '@/components/map/MapBackgroundLayer';
import MapCountryGeoJSON from '@/components/map/MapCountryGeoJSON';
import MapFitBounds, { FIT_PADDING, FIT_PAN_VISCOSITY } from '@/components/map/MapFitBounds';
import MapInsetFrames from '@/components/map/MapInsetFrames';
import MapStickyTooltip from '@/components/map/tooltip/MapStickyTooltip';
import MapInstanceBridge from '@/components/map/MapInstanceBridge';
import { MapContext, useMapScope } from '@/components/map/MapProvider';
import {
  getLoadedMapComponents,
  getLoadedWorldGeoJson,
  loadMapComponents,
  loadWorldGeoJson,
} from '@/components/map/map-assets';
import { bboxToLatLngs } from '@/components/map/bbox';
import { MapSelectionContextProvider } from '@/contexts/MapSelectionContextProvider';
import type { GeoMapResponse } from '@/entities/analytics/geography.entities';
import type { FeatureDisplayResolver, RegionGeoJson } from '@/components/map/types';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import { getCountryName } from '@/utils/countryCodes';
import type { LatLngBoundsExpression, Map as LeafletMapInstance } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useDebounce } from '@/hooks/useDebounce';

const ANTARCTICA_CODE = 'AQ';
const isAntarctica = (featureId: string) => featureId === ANTARCTICA_CODE;

export type MapSelectionControl = {
  selectedId: string | null;
  onToggle: (featureId: string) => void;
  onClear: () => void;
};

type LeafletMapProps = GeoMapResponse & {
  showZoomControls?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
  children?: ReactNode;
  geoJsonData?: RegionGeoJson;
  resolveDisplay?: FeatureDisplayResolver;
  selection?: MapSelectionControl;
};

export default function LeafletMap({
  visitorData,
  compareData,
  maxVisitors,
  showZoomControls,
  size = 'sm',
  initialZoom,
  children,
  geoJsonData,
  resolveDisplay: resolveDisplayProp,
  selection,
}: LeafletMapProps) {
  const [worldGeoJson, setWorldGeoJson] = useState(getLoadedWorldGeoJson);
  const [mapComponents, setMapComponents] = useState(getLoadedMapComponents);
  const geoJson = geoJsonData ?? worldGeoJson;
  const outerScope = useMapScope();
  const [localMap, setLocalMap] = useState<LeafletMapInstance | null>(null);
  const scope = useMemo(() => outerScope ?? { map: localMap, setMap: setLocalMap }, [outerScope, localMap]);
  const locale = useLocale();
  const style = useMapStyle({ maxValue: maxVisitors || 1 });

  const { resolvedTheme } = useTheme();
  const debouncedTheme = useDebounce(resolvedTheme, 50);

  const defaultResolveDisplay = useMemo<FeatureDisplayResolver>(
    () => (featureId) => ({ name: getCountryName(featureId, locale), countryCode: featureId }),
    [locale],
  );
  const resolveDisplay = resolveDisplayProp ?? defaultResolveDisplay;

  const ready = Boolean(mapComponents && geoJson);
  useEffect(() => {
    if (ready) return;
    Promise.all([loadMapComponents(), geoJsonData ? null : loadWorldGeoJson()])
      .then(([components, world]) => {
        setMapComponents(components);
        if (world) setWorldGeoJson(world);
      })
      .catch((error) => console.error('Error loading map dependencies:', error));
  }, [ready, geoJsonData]);

  const contentBounds = useMemo(() => {
    const L = mapComponents?.L;
    return L && geoJson?.viewBbox ? L.latLngBounds(bboxToLatLngs(geoJson.viewBbox)) : null;
  }, [mapComponents, geoJson]);

  const worldBounds = useMemo(() => {
    const L = mapComponents?.L;
    if (!L || contentBounds) return null;
    const hasAntarctica = visitorData.some((d) => d.code === ANTARCTICA_CODE && d.visitors);
    return L.latLngBounds(L.latLng(hasAntarctica ? -100 : -60, -220), L.latLng(100, 220));
  }, [mapComponents, contentBounds, visitorData]);

  // Leaflet only redraws paths on moveend, so the SVG must cover half a viewport of drag on each side
  const renderer = useMemo(() => mapComponents?.L.svg({ padding: 0.5 }), [mapComponents]);

  if (!mapComponents || !geoJson || !style) {
    return <GeographyLoading className='bg-transparent' />;
  }

  const { MapContainer, GeoJSON, Polygon, Rectangle, Marker, L } = mapComponents;

  const containerProps = contentBounds
    ? {
        bounds: contentBounds,
        boundsOptions: { padding: FIT_PADDING },
        maxBoundsViscosity: FIT_PAN_VISCOSITY,
      }
    : {
        center: [20, 0] as [number, number],
        zoom: initialZoom || 2,
        maxBounds: worldBounds as LatLngBoundsExpression,
        maxBoundsViscosity: 0.5,
        minZoom: 1,
        maxZoom: 7,
      };

  return (
    <MapContext.Provider value={scope}>
      <div className='relative h-full w-full' key={debouncedTheme}>
        {style.LeafletCSS}
        <MapSelectionContextProvider style={style} selectedFeatureId={selection?.selectedId}>
          <MapContainer
            {...containerProps}
            style={{ height: '100%', width: '100%' }}
            zoomControl={showZoomControls}
            renderer={renderer}
            zoomDelta={0.1}
            zoomSnap={0.1}
            doubleClickZoom={false}
            attributionControl={false}
          >
            <MapBackgroundLayer Polygon={Polygon} onClick={selection?.onClear} />
            <MapCountryGeoJSON
              GeoJSON={GeoJSON}
              geoData={geoJson}
              visitorData={visitorData}
              compareData={compareData}
              style={style}
              size={size}
              resolveDisplay={resolveDisplay}
              hideWhenEmpty={geoJsonData ? undefined : isAntarctica}
              onFeatureClick={selection?.onToggle}
            />
            {geoJson.insets && (
              <MapInsetFrames L={L} Rectangle={Rectangle} Marker={Marker} frames={geoJson.insets} />
            )}
            {contentBounds && <MapFitBounds bounds={contentBounds} />}
            <MapStickyTooltip size={size} />
            {(children || outerScope) && <MapInstanceBridge setMap={scope.setMap} />}
          </MapContainer>
          {children}
        </MapSelectionContextProvider>
      </div>
    </MapContext.Provider>
  );
}
