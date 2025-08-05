import React from 'react';
import { type GeoJSON } from 'react-leaflet';
import { useMapSelection } from '@/contexts/MapSelectionProvider';
import { Feature, Geometry } from 'geojson';

interface MapCountryGeoJSONProps {
  GeoJSON: typeof GeoJSON;
  data: any; //! TODO type stricter
  options?: any; //! TODO type stricter
}

const DEFAULT_OPTS = {
  updateWhenIdle: true,
  buffer: 2,
};

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

const MapCountryGeoJSONComponent = ({ GeoJSON, data, options = DEFAULT_OPTS }: MapCountryGeoJSONProps) => {
  const { setSelectedFeature, setHoveredFeature } = useMapSelection();

  //! TODO: Implement
  //        Dont touch style changes @events in here, only setSelected / setHovered and setup
  //        default style
  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;

    // let visitorEntry = visitorData.find((d) => d.country_code === alpha2);
    // if (!visitorEntry) {
    //   visitorEntry = { country_code: alpha2, visitors: 0 };
    // }
    //!
    // layer.setStyle(style.originalStyle(visitorEntry.visitors));
    // isMobile ? mobileFeatureHandler(visitorEntry, layer) : desktopFeatureHandler(visitorEntry, layer);
  };

  return <GeoJSON data={data} onEachFeature={onEachFeature} {...options} />;
};

const MapCountryGeoJSON = React.memo(MapCountryGeoJSONComponent);
export default MapCountryGeoJSON;
