import { useMap, GeoJSON } from 'react-leaflet';
import { useEffect, useMemo, useState } from 'react';
import type { Feature, FeatureCollection, Polygon as GeoJsonPolygon, MultiPolygon, Polygon } from 'geojson';
import { difference, multiPolygon, polygon, union } from '@turf/turf';

interface BackgroundLayerProps {
  onSelect: () => void;
  worldGeoJson?: FeatureCollection; // Pass world countries GeoJSON as prop
}

const MapBackgroundLayer = ({ onSelect, worldGeoJson }: BackgroundLayerProps) => {
  const invertedBackground = useMemo(() => {
    if (!worldGeoJson) return null;

    const fullWorldPolygon = polygon([
      [
        [-230, -120], // extend longitude 50 degrees left
        [230, -120],  // extend longitude 50 degrees right
        [230, 120],   // extend latitude 30 degrees top
        [-230, 120],  // extend latitude 30 degrees bottom
        [-230, -120]
      ],
    ]);

    const polygonFeatures: Feature<GeoJsonPolygon | MultiPolygon>[] = worldGeoJson.features.filter(
      (f): f is Feature<GeoJsonPolygon | MultiPolygon> =>
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
    );

    const polygonsCollection: FeatureCollection<GeoJsonPolygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: polygonFeatures,
    };

    const unioned = union(polygonsCollection);
    if (!unioned) return fullWorldPolygon;

    const featureCollection: FeatureCollection<GeoJsonPolygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: [fullWorldPolygon, unioned],
    };

    const diff = difference(featureCollection);
    return diff || fullWorldPolygon;
  }, [
    // Depend ONLY on the geometries, so we don't recompute if only properties change
    JSON.stringify(worldGeoJson?.features.map(f => f.geometry))
  ]);

  if (!invertedBackground) return null;

  return (
    <GeoJSON
      data={invertedBackground}
      style={{
        fillColor: 'transparent',
        color: 'transparent',
        weight: 0,
      }}
      eventHandlers={{
        click: onSelect,
        mouseover: onSelect,
      }}
    />
  );
};

export default MapBackgroundLayer;
