import React, { useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { type GeoJSON } from 'react-leaflet';
import { MapFeatureVisitor, useMapSelection } from '@/contexts/MapSelectionProvider';
import { Feature, Geometry } from 'geojson';
import { GeoVisitor } from '@/entities/geography';
import { LeafletStyle } from '@/hooks/leaflet/use-leaflet-style';
import { LeafletMouseEvent } from 'leaflet';
import MapTooltipContent from './tooltip/MapTooltipContent';

interface MapCountryGeoJSONProps {
  GeoJSON: typeof GeoJSON;
  geoData: any; //! TODO type stricter
  visitorData: GeoVisitor[];
  style: LeafletStyle;
  options?: any; //! TODO type stricter
  size?: 'sm' | 'lg';
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
  size = 'sm',
  style,
  options = DEFAULT_OPTS,
}: MapCountryGeoJSONProps) => {
  const { setFeatures } = useMapSelection();

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;

    let geoVisitor = visitorData.find((d) => d.country_code === alpha2);
    if (!geoVisitor) {
      geoVisitor = { country_code: alpha2, visitors: 0 };
    }

    layer.setStyle(style.originalStyle(geoVisitor.visitors));
    layer.unbindTooltip();
    layer.unbindPopup();

    const popupHtml = renderToString(<MapTooltipContent geoVisitor={geoVisitor} size={size} className='' />);
    layer.bindPopup(popupHtml, {
      autoPan: true,
      autoPanPadding: [25, 10],
      closeButton: false,
    });

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        setFeatures({ hovered: { geoVisitor, layer } });
      },
      click: (e: LeafletMouseEvent) => {
        setFeatures({ selected: { geoVisitor, layer } });
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
