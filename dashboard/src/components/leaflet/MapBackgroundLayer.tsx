import React, { useMemo } from 'react';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import difference from '@turf/difference';
import union from '@turf/union';

interface BackgroundLayerProps {
  onSelect: () => void;
  worldGeoJson?: FeatureCollection; // Pass world countries GeoJSON as prop
  GeoJSON: typeof import('react-leaflet').GeoJSON;
}

const MapBackgroundLayerComponent = ({ onSelect, worldGeoJson, GeoJSON }: BackgroundLayerProps) => {
  const invertedBackground = useMemo(() => {
    if (!worldGeoJson) return null;
    
    const fullWorldPolygon: Feature<Polygon> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-230, -120],
          [230, -120],
          [230, 120],
          [-230, 120],
          [-230, -120],
        ]],
      },
      properties: {},
    };

    const polygonFeatures: Feature<Polygon | MultiPolygon>[] = worldGeoJson.features.filter(
      (f): f is Feature<Polygon | MultiPolygon> =>
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
    );

    const polygonsCollection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: polygonFeatures,
    };

    const unioned = union(polygonsCollection);
    if (!unioned) return fullWorldPolygon;

    const featureCollection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: [fullWorldPolygon, unioned],
    };

    const diff = difference(featureCollection);
    return diff || fullWorldPolygon;
  }, [
    // Depend ONLY on the geometries, so we don't recompute if only properties change
    JSON.stringify(worldGeoJson?.features.map((f) => f.geometry)),
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
const MapBackgroundLayer = React.memo(MapBackgroundLayerComponent);
export default MapBackgroundLayer;