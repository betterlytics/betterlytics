import { useMapSelection } from '@/contexts/MapSelectionContextProvider';
import { GeoVisitor } from '@/entities/geography';
import { MapStyle } from '@/hooks/use-leaflet-style';
import type { Feature, Geometry } from 'geojson';
import type { LeafletMouseEvent } from 'leaflet';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { GeoJSON } from 'react-leaflet';
import MapTooltipContent from './tooltip/MapTooltipContent';

interface MapCountryGeoJSONProps {
  GeoJSON: typeof GeoJSON;
  geoData: GeoJSON.FeatureCollection;
  visitorData: GeoVisitor[];
  style: MapStyle;
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
}: MapCountryGeoJSONProps) => {
  const { setMapSelection } = useMapSelection();

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const country_code = getFeatureId(feature);
    if (!country_code) return;

    let geoVisitor = visitorData.find((d) => d.country_code === country_code);
    if (!geoVisitor) {
      geoVisitor = { country_code, visitors: 0 };
    }

    layer.setStyle(style.originalStyle(geoVisitor.visitors));
    layer.unbindTooltip();
    layer.unbindPopup();

    const popupHtml = renderToString(<MapTooltipContent geoVisitor={geoVisitor} size={size} />);

    layer.bindPopup(popupHtml, {
      autoPan: true,
      autoPanPadding: [25, 10],
      closeButton: false,
    });

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        setMapSelection({ hovered: { geoVisitor, layer } });
      },
      click: (e: LeafletMouseEvent) => {
        setMapSelection({ clicked: { geoVisitor, layer } });
      },
    });
  };

  return <GeoJSON key={visitorData.length} data={geoData} onEachFeature={onEachFeature} {...DEFAULT_OPTS} />;
};

const MapCountryGeoJSON = React.memo(MapCountryGeoJSONComponent);
MapCountryGeoJSON.displayName = 'MapCountryGeoJSON';
export default MapCountryGeoJSON;
