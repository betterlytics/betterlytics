'use client';

import { MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { GeoVisitor } from '@/entities/geography';
import { useLeafletFeatures } from '@/hooks/use-leaflet-features';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState } from 'react';
import MapTooltip from './leaflet/MapTooltip';
import MapBackgroundLayer from './leaflet/MapBackgroundLayer';

interface LeafletMapProps {
  visitorData: GeoVisitor[];
  maxVisitors?: number;
  showZoomControls?: boolean;
  showLegend?: boolean;
  initialZoom?: number;
  size?: 'sm' | 'lg';
}

const geoJsonOptions = {
  updateWhenIdle: true,
  buffer: 2,
};

const LeafletMap = ({
  visitorData,
  maxVisitors,
  showZoomControls,
  showLegend = true,
  size = 'sm',
  initialZoom,
}: LeafletMapProps) => {
  const [worldGeoJson, setWorldGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [inverseWorldGeoJson, setInverseWorldGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapComponents, setMapComponents] = useState<{
    L: typeof import('leaflet');
    MapContainer: typeof import('react-leaflet').MapContainer;
    GeoJSON: typeof import('react-leaflet').GeoJSON;
  } | null>(null);
  const calculatedMaxVisitors = maxVisitors || Math.max(...visitorData.map((d) => d.visitors), 1);
  const { selectedCountry, setSelectedCountry, onEachFeature } = useLeafletFeatures({
    visitorData,
    calculatedMaxVisitors,
  });

  useEffect(() => {
    setIsLoading(true);

    const loadMapDependencies = async () => {
      try {
        const [leafletModule, reactLeafletModule, worldRes, inverseWorldRes] = await Promise.all([
          import('leaflet'),
          import('react-leaflet'),
          fetch('/data/countries.geo.json'),
          fetch('/data/notcountries.geo.json'),
        ]);

        const world = await worldRes.json();
        const inverseWorld = await inverseWorldRes.json();

        setMapComponents({
          L: leafletModule.default,
          MapContainer: reactLeafletModule.MapContainer,
          GeoJSON: reactLeafletModule.GeoJSON,
        });
        setWorldGeoJson(world);
        setInverseWorldGeoJson(inverseWorld);
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

  if (isLoading || !mapComponents || !worldGeoJson || !inverseWorldGeoJson) {
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
      <style jsx global>{`
        .leaflet-container {
          background-color: var(--color-card);
        }
        .leaflet-interactive:focus {
          outline: none !important; /** Remove square around selection area */
        }
      `}</style>
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
        <GeoJSON
          key={JSON.stringify(visitorData.length)}
          data={worldGeoJson}
          onEachFeature={onEachFeature}
          {...geoJsonOptions}
        />
        <MapBackgroundLayer
          GeoJSON={mapComponents.GeoJSON}
          inverseWorldGeoJson={inverseWorldGeoJson}
          onDeselect={() => setSelectedCountry(null)}
        />
        <MapTooltip
          selectedCountry={
            selectedCountry
              ? {
                  code: selectedCountry.code,
                  visitors: selectedCountry.visitors,
                }
              : selectedCountry
          }
          size={size}
        />
        {showLegend && (
          <div className='info-legend bg-card border-border absolute right-[1%] bottom-[1%] rounded-md border p-2.5 shadow'>
            <h4 className='text-foreground mb-1.5 font-medium'>Visitors</h4>
            <div className='flex items-center'>
              <span className='text-muted-foreground mr-1 text-xs'>0</span>
              <div
                className='h-2 w-24 rounded'
                style={{
                  background: `linear-gradient(to right, ${MAP_VISITOR_COLORS.NO_VISITORS} 0%, ${MAP_VISITOR_COLORS.NO_VISITORS} 2%, ${MAP_VISITOR_COLORS.LOW_VISITORS} 3%, ${MAP_VISITOR_COLORS.HIGH_VISITORS} 100%)`,
                }}
              ></div>
              <span className='text-muted-foreground ml-1 text-xs'>{calculatedMaxVisitors.toLocaleString()}</span>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
