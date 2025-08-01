import React from 'react';
import type { FeatureCollection } from 'geojson';
import type { GeoJSON } from 'react-leaflet';
import type { LeafletEventHandlerFnMap } from 'leaflet';

interface MapBackgroundLayerProps {
  GeoJSON: typeof GeoJSON;
  inverseWorldGeoJson: FeatureCollection;
  eventHandlers: LeafletEventHandlerFnMap;
}

const MapBackgroundLayerComponent = ({ GeoJSON, inverseWorldGeoJson, eventHandlers }: MapBackgroundLayerProps) => {
  return (
    <GeoJSON
      data={inverseWorldGeoJson}
      style={{
        fillColor: 'transparent',
        color: 'transparent',
        weight: 0,
      }}
      eventHandlers={eventHandlers}
    />
  );
};

const MapBackgroundLayer = React.memo(MapBackgroundLayerComponent);
export default MapBackgroundLayer;
