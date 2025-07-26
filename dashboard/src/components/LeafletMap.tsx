'use client';

import { renderToString } from 'react-dom/server';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import React, { useEffect, useState, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import 'leaflet/dist/leaflet.css';
import { Feature, Geometry } from 'geojson';
import { GeoVisitor } from '@/entities/geography';
import { LatLngBoundsExpression } from 'leaflet';
import { alpha3ToAlpha2Code, getCountryName } from '@/utils/countryCodes';
import { FlagIconProps } from './icons';

interface LeafletMapProps {
  visitorData: GeoVisitor[];
  maxVisitors?: number;
  showZoomControls?: boolean;
  showLegend?: boolean;
  initialZoom?: number;
}

const geoJsonOptions = {
  updateWhenIdle: true,
  buffer: 2,
};

const MAP_COLORS = {
  NO_VISITORS: '#6b7280', // Gray for 0 visitors
  HIGH_VISITORS: '#60a5fa', // Light blue for high visitor counts
  LOW_VISITORS: '#1e40af', // Dark blue for low visitor counts
} as const;

const BORDER_COLORS = {
  NO_VISITORS: '#9ca3af', // Lighter gray for 0 visitors border
  HIGH_VISITORS: '#93c5fd', // Lighter version of light blue
  LOW_VISITORS: '#3b82f6', // Lighter version of dark blue
} as const;

const LeafletMap = ({
  visitorData,
  maxVisitors,
  showZoomControls,
  showLegend = true,
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

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 1, calculatedMaxVisitors])
      .range([MAP_COLORS.NO_VISITORS, MAP_COLORS.LOW_VISITORS, MAP_COLORS.HIGH_VISITORS]);
  }, [calculatedMaxVisitors]);

  const borderColorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 1, calculatedMaxVisitors])
      .range([BORDER_COLORS.NO_VISITORS, BORDER_COLORS.LOW_VISITORS, BORDER_COLORS.HIGH_VISITORS]);
  }, [calculatedMaxVisitors]);

  const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>): string | undefined => {
    if (!feature || !feature.properties || !feature.id) return undefined;
    return String(feature.id);
  };

  const styleGeoJson = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties> | undefined) => {
    if (!feature) return {};

    const featureId = getFeatureId(feature);
    const visitorEntry = visitorData.find((d) => d.country_code === featureId);
    const visitors = visitorEntry ? visitorEntry.visitors : 0;

    const fillColor = colorScale(visitors);
    const borderColor = borderColorScale(visitors);

    return {
      fillColor,
      weight: 1.3,
      opacity: 1,
      color: borderColor,
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Layer) => {
    if (!feature.properties) return;

    const featureId = getFeatureId(feature);
    if (!featureId) return;

    const visitorEntry = visitorData.find((d) => d.country_code === featureId);
    const visitors = visitorEntry ? visitorEntry.visitors.toLocaleString() : '0';

    const popupHtml = renderToString(
      <div className='space-y-1'>
        <CountryDisplay
          className='font-bold'
          countryCode={featureId as FlagIconProps['countryCode']}
          countryName={getCountryName(featureId)}
        />
        <div className='text-muted-foreground text-sm'>Visitors: {visitors}</div>
      </div>,
    );

    layer.bindPopup(popupHtml, {
      autoPan: true,
      autoPanPadding: [25, 10],
      offset: mapComponents?.L.point(0, 10),
    });

    layer.on({
      click: (e: L.LeafletMouseEvent) => {
        layer.openPopup(e.latlng);
      },
    });
  };

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
      <style jsx global>{`
        .leaflet-container {
          background-color: var(--color-card);
        }
        .leaflet-popup-content-wrapper {
          display: inline-block;
          width: fit-content !important;
        }
        .leaflet-popup-content {
          white-space: normal;
          width: fit-content !important;
          max-width: 50vw;
          min-width: 80px; // Min-width ensure 'Visitors: x' stays on one row
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
          style={styleGeoJson}
          onEachFeature={onEachFeature}
          {...geoJsonOptions}
        />
        {showLegend && (
          <div className='info-legend bg-card border-border absolute right-[1%] bottom-[1%] rounded-md border p-2.5 shadow'>
            <h4 className='text-foreground mb-1.5 font-medium'>Visitors</h4>
            <div className='flex items-center'>
              <span className='text-muted-foreground mr-1 text-xs'>0</span>
              <div
                className='h-2 w-24 rounded'
                style={{
                  background: `linear-gradient(to right, ${MAP_COLORS.NO_VISITORS} 0%, ${MAP_COLORS.NO_VISITORS} 2%, ${MAP_COLORS.LOW_VISITORS} 3%, ${MAP_COLORS.HIGH_VISITORS} 100%)`,
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
