import React from 'react';
import type { FeatureCollection } from 'geojson';
import type { GeoJSON } from 'react-leaflet';

interface MapBackgroundLayerProps {
  GeoJSON: typeof GeoJSON;
  inverseWorldGeoJson: FeatureCollection;
  onDeselect: () => void;
}

const MapBackgroundLayerComponent = ({ GeoJSON, inverseWorldGeoJson, onDeselect }: MapBackgroundLayerProps) => {
  return (
    <GeoJSON
      data={inverseWorldGeoJson}
      style={{
        fillColor: 'transparent',
        color: 'transparent',
        weight: 0,
      }}
      eventHandlers={{
        click: onDeselect,
        mouseover: onDeselect,
      }}
    />
  );
};

const MapBackgroundLayer = React.memo(MapBackgroundLayerComponent);
export default MapBackgroundLayer;
