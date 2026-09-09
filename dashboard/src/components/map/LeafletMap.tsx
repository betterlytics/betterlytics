'use client';

import MapBackgroundLayer from '@/components/map/MapBackgroundLayer';
import MapCountryGeoJSON from '@/components/map/MapCountryGeoJSON';
import MapFitBounds from '@/components/map/MapFitBounds';
import MapInsetFrames from '@/components/map/MapInsetFrames';
import MapLegend from '@/components/map/MapLegend';
import MapStickyTooltip from '@/components/map/tooltip/MapStickyTooltip';
import { MapSelectionContextProvider } from '@/contexts/MapSelectionContextProvider';
import type { GeoMapResponse } from '@/entities/analytics/geography.entities';
import type { FeatureDisplayResolver, RegionGeoJson } from '@/components/map/types';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import { getCountryName } from '@/utils/countryCodes';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState, useTransition } from 'react';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useDebounce } from '@/hooks/useDebounce';

type LeafletMapProps = GeoMapResponse & {
  showZoomControls?: boolean;
  showLegend?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
  geoJsonData?: RegionGeoJson;
  geoJsonUrl?: string;
  resolveDisplay?: FeatureDisplayResolver;
  shouldHideFeature?: (featureId: string) => boolean;
  onFeatureClick?: (featureId: string) => void;
  fitBounds?: boolean;
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
  geoJsonData,
  geoJsonUrl = '/data/countries.geo.json',
  resolveDisplay: resolveDisplayProp,
  shouldHideFeature,
  onFeatureClick,
  fitBounds = false,
  interactionConfig,
}: LeafletMapProps) {
  const [geoJson, setGeoJson] = useState<RegionGeoJson | null>(null);
  const [mapComponents, setMapComponents] = useState<{
    L: typeof import('leaflet');
    MapContainer: typeof import('react-leaflet').MapContainer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
    Polygon: typeof import('react-leaflet').Polygon;
    Rectangle: typeof import('react-leaflet').Rectangle;
    Marker: typeof import('react-leaflet').Marker;
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

  useEffect(() => {
    startTransition(() => {
      const loadMapDependencies = async () => {
        try {
          const [leafletModule, reactLeafletModule, geoData] = await Promise.all([
            import('leaflet'),
            import('react-leaflet'),
            geoJsonData ?? fetch(geoJsonUrl).then((res) => (res.ok ? res.json() : null)),
          ]);

          if (!geoData) return;

          setMapComponents({
            L: leafletModule.default,
            MapContainer: reactLeafletModule.MapContainer,
            GeoJSON: reactLeafletModule.GeoJSON,
            Polygon: reactLeafletModule.Polygon,
            Rectangle: reactLeafletModule.Rectangle,
            Marker: reactLeafletModule.Marker,
          });
          setGeoJson(geoData);
        } catch (err) {
          console.error('Error loading map dependencies:', err);
        }
      };

      loadMapDependencies();
    });
  }, [geoJsonUrl, geoJsonData]);

  const worldBounds = useMemo(() => {
    if (!mapComponents?.L) return null;
    const hasAntarctica = visitorData.some((d) => d.code === 'AQ' && d.visitors);
    return mapComponents.L.latLngBounds(
      mapComponents.L.latLng(hasAntarctica ? -100 : -60, -220),
      mapComponents.L.latLng(100, 220),
    );
  }, [mapComponents, visitorData]);

  const contentBounds = useMemo(() => {
    if (!fitBounds || !mapComponents?.L || !geoJson) return null;
    const bounds = mapComponents.L.geoJSON(geoJson).getBounds();
    for (const frame of geoJson.insets ?? []) {
      bounds.extend([frame.bbox[1], frame.bbox[0]]);
      bounds.extend([frame.bbox[3], frame.bbox[2]]);
    }
    return bounds;
  }, [fitBounds, mapComponents, geoJson]);

  if (isPending || !mapComponents || !geoJson || !style) {
    return <GeographyLoading />;
  }

  const { MapContainer, GeoJSON, Polygon, Rectangle, Marker, L } = mapComponents;

  const containerProps =
    fitBounds && contentBounds
      ? {
          bounds: contentBounds,
          boundsOptions: { padding: [16, 16] as [number, number] },
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
    <div className='h-full w-full' key={debouncedTheme}>
      {style.LeafletCSS}
      <MapContainer
        {...containerProps}
        style={{ height: '100%', width: '100%' }}
        zoomControl={showZoomControls}
        zoomDelta={0.1}
        zoomSnap={0.1}
        attributionControl={false}
        {...interactionConfig}
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
          {geoJson.insets && geoJson.insets.length > 0 && (
            <MapInsetFrames L={L} Rectangle={Rectangle} Marker={Marker} frames={geoJson.insets} />
          )}
          {fitBounds && contentBounds && <MapFitBounds bounds={contentBounds} />}
          <MapStickyTooltip size={size} resolveDisplay={resolveDisplay} />
          {showLegend && <MapLegend maxVisitors={maxVisitors} />}
        </MapSelectionContextProvider>
      </MapContainer>
    </div>
  );
}
