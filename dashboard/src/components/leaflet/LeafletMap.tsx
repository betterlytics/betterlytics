'use client';

import { GeoVisitor } from '@/entities/geography';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState } from 'react';
import MapBackgroundLayer from '@/components/leaflet/MapBackgroundLayer';
import MapStickyTooltip from '@/components/leaflet/tooltip/MapStickyTooltip';
import { useLeafletStyle } from '@/hooks/use-leaflet-style';
import { MapSelectionContextProvider } from '@/contexts/MapSelectionProvider';
import MapCountryGeoJSON from './MapCountryGeoJSON';
import MapLegend from './MapLegend';

interface LeafletMapProps {
  visitorData: GeoVisitor[];
  maxVisitors?: number;
  showZoomControls?: boolean;
  showLegend?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
}

const LeafletMap = ({
  visitorData,
  maxVisitors,
  showZoomControls,
  showLegend = true,
  size = 'sm',
  initialZoom,
}: LeafletMapProps) => {
  const [worldGeoJson, setWorldGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapComponents, setMapComponents] = useState<{
    L: typeof import('leaflet');
    MapContainer: typeof import('react-leaflet').MapContainer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
  } | null>(null);
  const calculatedMaxVisitors = maxVisitors || Math.max(...visitorData.map((d) => d.visitors), 1);

  const style = useLeafletStyle({ calculatedMaxVisitors, size });

  useEffect(() => {
    setIsLoading(true);

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
        });
        setWorldGeoJson(world);
      } catch (err) {
        console.error('Error loading map dependencies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapDependencies();
  }, []);

  const MAX_WORLD_BOUNDS = useMemo(() => {
    if (!mapComponents?.L) return null;
    return mapComponents.L.latLngBounds(mapComponents.L.latLng(-100, -220), mapComponents.L.latLng(100, 220));
  }, [mapComponents]);

  if (isLoading || !mapComponents || !worldGeoJson) {
    return (
      <div className='bg-background/70 flex h-full w-full items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='border-accent border-t-primary mb-2 h-8 w-8 animate-spin rounded-full border-4'></div>
          <p className='text-foreground'>Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, GeoJSON } = mapComponents;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {style.LeafletCSS}
      <MapContainer
        center={[20, 0]}
        style={{ height: '100%', width: '100%' }}
        zoom={initialZoom || 2}
        zoomControl={showZoomControls}
        maxBounds={MAX_WORLD_BOUNDS as LatLngBoundsExpression}
        maxBoundsViscosity={0.5}
        minZoom={1}
        maxZoom={7}
        attributionControl={false}
      >
        <MapSelectionContextProvider style={style}>
          <MapBackgroundLayer GeoJSON={GeoJSON} />
          <MapCountryGeoJSON GeoJSON={GeoJSON} geoData={worldGeoJson} visitorData={visitorData} style={style} />
          <MapStickyTooltip size={size} />
          {showLegend && <MapLegend maxVisitors={maxVisitors} />}
        </MapSelectionContextProvider>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
