'use client';

import MapBackgroundLayer from '@/components/map/MapBackgroundLayer';
import MapCountryGeoJSON from '@/components/map/MapCountryGeoJSON';
import MapLegend from '@/components/map/MapLegend';
import MapStickyTooltip from '@/components/map/tooltip/MapStickyTooltip';
import { MapSelectionContextProvider } from '@/contexts/MapSelectionContextProvider';
import type { WorldMapResponse } from '@/entities/geography';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { Spinner } from '../ui/spinner';
import { useTranslations } from 'next-intl';

type LeafletMapProps = WorldMapResponse & {
  showZoomControls?: boolean;
  showLegend?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
};

export default function LeafletMap({
  visitorData,
  compareData,
  maxVisitors,
  showZoomControls,
  showLegend = true,
  size = 'sm',
  initialZoom,
}: LeafletMapProps) {
  const [worldGeoJson, setWorldGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mapComponents, setMapComponents] = useState<{
    L: typeof import('leaflet');
    MapContainer: typeof import('react-leaflet').MapContainer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
    Polygon: typeof import('react-leaflet').Polygon;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('components.geography');
  const calculatedMaxVisitors = maxVisitors || Math.max(...visitorData.map((d) => d.visitors), 1);
  const style = useMapStyle({ calculatedMaxVisitors });

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

  if (isPending || !mapComponents || !worldGeoJson) {
    return (
      <div className='bg-background/70 flex h-full w-full items-center justify-center'>
        <div className='flex flex-col items-center'>
          <Spinner size='lg' />
          <p className='text-muted-foreground mt-2'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  const { MapContainer, GeoJSON, Polygon } = mapComponents;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {style.LeafletCSS}
      <MapContainer
        center={[20, 0]}
        style={{ height: '100%', width: '100%' }}
        zoom={initialZoom || 2}
        zoomControl={showZoomControls}
        maxBounds={worldBounds as LatLngBoundsExpression}
        maxBoundsViscosity={0.5}
        minZoom={1}
        maxZoom={7}
        attributionControl={false}
      >
        <MapSelectionContextProvider style={style}>
          <MapBackgroundLayer Polygon={Polygon} />
          <MapCountryGeoJSON
            GeoJSON={GeoJSON}
            geoData={worldGeoJson}
            visitorData={visitorData}
            compareData={compareData}
            style={style}
            size={size}
          />
          <MapStickyTooltip size={size} />
          {showLegend && <MapLegend maxVisitors={maxVisitors} />}
        </MapSelectionContextProvider>
      </MapContainer>
    </div>
  );
}
