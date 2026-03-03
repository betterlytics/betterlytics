'use client';

import MapBackgroundLayer from '@/components/map/MapBackgroundLayer';
import MapCountryGeoJSON from '@/components/map/MapCountryGeoJSON';
import MapLegend from '@/components/map/MapLegend';
import MapStickyTooltip from '@/components/map/tooltip/MapStickyTooltip';
import { MapSelectionContextProvider } from '@/contexts/MapSelectionContextProvider';
import type { GeoFeatureVisitor } from '@/entities/analytics/geography.entities';
import type { FeatureDisplayResolver } from '@/components/map/types';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import { getCountryName } from '@/utils/countryCodes';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useMemo, useState, useTransition } from 'react';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useDebounce } from '@/hooks/useDebounce';

type LeafletMapProps = {
  visitorData: GeoFeatureVisitor[];
  compareData: GeoFeatureVisitor[];
  maxVisitors: number;
  showZoomControls?: boolean;
  showLegend?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
  geoJsonUrl?: string;
  geoJsonData?: GeoJSON.FeatureCollection;
  resolveDisplay?: FeatureDisplayResolver;
  fitBounds?: boolean;
  shouldHideFeature?: (featureId: string) => boolean;
  onFeatureClick?: (featureId: string) => void;
  interactionConfig?: {
    dragging?: boolean;
    scrollWheelZoom?: boolean;
    doubleClickZoom?: boolean;
    touchZoom?: boolean;
  };
};

export default function LeafletMap({
  visitorData,
  compareData,
  maxVisitors,
  showZoomControls,
  showLegend = true,
  size = 'sm',
  initialZoom,
  geoJsonUrl = '/data/countries.geo.json',
  geoJsonData,
  resolveDisplay: resolveDisplayProp,
  fitBounds = false,
  shouldHideFeature,
  onFeatureClick,
  interactionConfig,
}: LeafletMapProps) {
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mapComponents, setMapComponents] = useState<{
    L: typeof import('leaflet');
    MapContainer: typeof import('react-leaflet').MapContainer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
    Polygon: typeof import('react-leaflet').Polygon;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const style = useMapStyle({ maxValue: maxVisitors || 1 });

  const { resolvedTheme } = useTheme();
  const debouncedTheme = useDebounce(resolvedTheme, 50);

  const defaultResolveDisplay = useMemo<FeatureDisplayResolver>(
    () => (featureId) => ({ name: getCountryName(featureId, locale), countryCode: featureId }),
    [locale],
  );
  const resolveDisplay = resolveDisplayProp ?? defaultResolveDisplay;

  React.useEffect(() => {
    startTransition(() => {
      const loadMapDependencies = async () => {
        try {
          const imports = [import('leaflet'), import('react-leaflet')] as const;

          if (geoJsonData) {
            const [leafletModule, reactLeafletModule] = await Promise.all(imports);
            setMapComponents({
              L: leafletModule.default,
              MapContainer: reactLeafletModule.MapContainer,
              GeoJSON: reactLeafletModule.GeoJSON,
              Polygon: reactLeafletModule.Polygon,
            });
            setGeoJson(geoJsonData);
            return;
          }

          const [leafletModule, reactLeafletModule, geoRes] = await Promise.all([
            ...imports,
            fetch(geoJsonUrl),
          ]);

          if (!geoRes.ok) return;
          const geoData = await geoRes.json();

          setMapComponents({
            L: leafletModule.default,
            MapContainer: reactLeafletModule.MapContainer,
            GeoJSON: reactLeafletModule.GeoJSON,
            Polygon: reactLeafletModule.Polygon,
          });
          setGeoJson(geoData);
        } catch (err) {
          console.error('Error loading map dependencies:', err);
        }
      };

      loadMapDependencies();
    });
  }, [geoJsonUrl, geoJsonData]);

  const mapBounds = useMemo(() => {
    if (!mapComponents?.L || !geoJson) return null;
    if (fitBounds) {
      return mapComponents.L.geoJSON(geoJson).getBounds();
    }
    const hasAntarctica = visitorData.some((d) => d.code === 'AQ' && d.visitors);
    return mapComponents.L.latLngBounds(
      mapComponents.L.latLng(hasAntarctica ? -100 : -60, -220),
      mapComponents.L.latLng(100, 220),
    );
  }, [mapComponents, geoJson, visitorData, fitBounds]);

  if (isPending || !mapComponents || !geoJson || !style) {
    return <GeographyLoading />;
  }

  const { MapContainer, GeoJSON, Polygon } = mapComponents;

  const containerProps = fitBounds
    ? {
        bounds: mapBounds as LatLngBoundsExpression,
        boundsOptions: { padding: [10, 10] as [number, number] },
      }
    : {
        center: [20, 0] as [number, number],
        zoom: initialZoom || 2,
        maxBounds: mapBounds as LatLngBoundsExpression,
        maxBoundsViscosity: 0.5,
      };

  return (
    <div className='h-full w-full' key={`${geoJsonUrl}-${debouncedTheme}`}>
      {style.LeafletCSS}
      <MapContainer
        {...containerProps}
        style={{ height: '100%', width: '100%' }}
        zoomControl={showZoomControls}
        minZoom={1}
        maxZoom={7}
        zoomDelta={0.1}
        zoomSnap={0.1}
        attributionControl={false}
        dragging={interactionConfig?.dragging}
        scrollWheelZoom={interactionConfig?.scrollWheelZoom}
        doubleClickZoom={interactionConfig?.doubleClickZoom}
        touchZoom={interactionConfig?.touchZoom}
      >
        <MapSelectionContextProvider style={style}>
          <MapBackgroundLayer Polygon={Polygon} />
          <MapCountryGeoJSON
            GeoJSON={GeoJSON}
            geoData={geoJson}
            visitorData={visitorData}
            compareData={compareData}
            style={style}
            size={size}
            resolveDisplay={resolveDisplay}
            shouldHideFeature={shouldHideFeature}
            onFeatureClick={onFeatureClick}
          />
          <MapStickyTooltip size={size} resolveDisplay={resolveDisplay} />
          {showLegend && <MapLegend maxVisitors={maxVisitors} />}
        </MapSelectionContextProvider>
      </MapContainer>
    </div>
  );
}
