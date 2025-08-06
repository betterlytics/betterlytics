import React, { useEffect } from 'react';
import { type GeoJSON } from 'react-leaflet';
import { MapFeatureVisitor, useMapSelection } from '@/contexts/MapSelectionProvider';
import { Feature, Geometry } from 'geojson';
import { GeoVisitor } from '@/entities/geography';
import { LeafletStyle } from '@/hooks/leaflet/use-leaflet-style';
import { LeafletMouseEvent } from 'leaflet';

interface MapCountryGeoJSONProps {
  GeoJSON: typeof GeoJSON;
  geoData: any; //! TODO type stricter
  visitorData: GeoVisitor[];
  style: LeafletStyle;
  options?: any; //! TODO type stricter
}

const DEFAULT_OPTS = {
  updateWhenIdle: true,
  buffer: 2,
};

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

const MapCountryGeoJSONComponent = ({
  GeoJSON,
  geoData,
  visitorData,
  style,
  options = DEFAULT_OPTS,
}: MapCountryGeoJSONProps) => {
  const { selectedFeature, hoveredFeature, setSelectedFeature, setHoveredFeature } = useMapSelection();

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    console.log('[onEachFeature]', {
      id: feature.id,
      alpha2: getFeatureId(feature),
      layer,
      hasHandlers: !!layer.getEvents?.(),
    });

    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;

    let geoVisitor = visitorData.find((d) => d.country_code === alpha2);
    if (!geoVisitor) {
      geoVisitor = { country_code: alpha2, visitors: 0 };
    }
    const featureVisitor: MapFeatureVisitor = { geoVisitor, layer };

    layer.setStyle(style.originalStyle(geoVisitor.visitors));

    layer.unbindTooltip();
    layer.unbindPopup();

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        if (hoveredFeature?.geoVisitor.country_code !== featureVisitor.geoVisitor.country_code) {
          setHoveredFeature({ geoVisitor, layer });
        }
      },
      mouseout: (e: LeafletMouseEvent) => {
        if (hoveredFeature) {
          setHoveredFeature(undefined); // if not already set??
        }
      },
      click: (e: LeafletMouseEvent) => {
        if (selectedFeature?.geoVisitor.country_code !== featureVisitor.geoVisitor.country_code) {
          setSelectedFeature({ geoVisitor, layer });
        }
      },
    });
  };

  return (
    <GeoJSON
      key={JSON.stringify(visitorData.map((v) => v.country_code))}
      data={geoData}
      onEachFeature={onEachFeature}
      {...options}
    />
  );
};

const MapCountryGeoJSON = MapCountryGeoJSONComponent;
export default MapCountryGeoJSON;
