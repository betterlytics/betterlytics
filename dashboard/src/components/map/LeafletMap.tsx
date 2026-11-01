'use client';

import MapBackgroundLayer from '@/components/map/MapBackgroundLayer';
import MapCountryGeoJSON from '@/components/map/MapCountryGeoJSON';
import MapPopupAutoPan from '@/components/map/MapPopupAutoPan';
import MapStickyTooltip from '@/components/map/tooltip/MapStickyTooltip';
import { MapSelectionContextProvider } from '@/contexts/MapSelectionContextProvider';
import type { WorldMapResponse } from '@/entities/analytics/geography.entities';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useTheme } from 'next-themes';
import { useDebounce } from '@/hooks/useDebounce';

type LeafletMapProps = WorldMapResponse & {
  showZoomControls?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
  children?: ReactNode;
};

export default function LeafletMap({
  visitorData,
  compareData,
  maxVisitors,
  showZoomControls,
  size = 'sm',
  initialZoom,
  children,
}: LeafletMapProps) {
  const [worldGeoJson, setWorldGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mapComponents, setMapComponents] = useState<{
    L: typeof import('leaflet');
    MapContainer: typeof import('react-leaflet').MapContainer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
    Polygon: typeof import('react-leaflet').Polygon;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const style = useMapStyle({ maxValue: maxVisitors || 1 });

  const { resolvedTheme } = useTheme();
  const debouncedTheme = useDebounce(resolvedTheme, 50);

  useEffect(() => {
    startTransition(() => {
      const loadMapDependencies = async () => {
        try {
          const [leafletModule, reactLeafletModule, worldRes] = await Promise.all([
            import('leaflet'),
            import('react-leaflet'),
            fetch('/data/countries.geo.json'),
          ]);

          const world = await worldRes.json();

          setMapComponents({
            L: leafletModule.default,
            MapContainer: reactLeafletModule.MapContainer,
            GeoJSON: reactLeafletModule.GeoJSON,
            Polygon: reactLeafletModule.Polygon,
          });
          setWorldGeoJson(world);
        } catch (err) {
          console.error('Error loading map dependencies:', err);
        }
      };

      loadMapDependencies();
    });
  }, []);

  const worldBounds = useMemo(() => {
    if (!mapComponents?.L) return null;
    const hasAntarctica = visitorData.some((d) => d.country_code === 'AQ' && d.visitors);
    return mapComponents.L.latLngBounds(
      mapComponents.L.latLng(hasAntarctica ? -100 : -60, -220),
      mapComponents.L.latLng(100, 220),
    );
  }, [mapComponents, visitorData]);

  // Leaflet only redraws paths on moveend, so the SVG must cover half a viewport of drag on each side
  const renderer = useMemo(() => mapComponents?.L.svg({ padding: 0.5 }), [mapComponents]);

  if (isPending || !mapComponents || !worldGeoJson || !style) {
    return <GeographyLoading />;
  }

  const { MapContainer, GeoJSON, Polygon } = mapComponents;

  return (
    <div className='relative h-full w-full' key={debouncedTheme}>
      {style.LeafletCSS}
      <MapSelectionContextProvider style={style}>
        <MapContainer
          center={[20, 0]}
          style={{ height: '100%', width: '100%' }}
          zoom={initialZoom || 2}
          zoomControl={showZoomControls}
          maxBounds={worldBounds as LatLngBoundsExpression}
          maxBoundsViscosity={0.5}
          renderer={renderer}
          minZoom={1}
          maxZoom={7}
          zoomDelta={0.1}
          zoomSnap={0.1}
          attributionControl={false}
        >
          <MapBackgroundLayer Polygon={Polygon} />
          <MapCountryGeoJSON
            GeoJSON={GeoJSON}
            geoData={worldGeoJson}
            visitorData={visitorData}
            compareData={compareData}
            style={style}
          />
          <MapStickyTooltip size={size} />
          <MapPopupAutoPan />
        </MapContainer>
        {children}
      </MapSelectionContextProvider>
    </div>
  );
}
