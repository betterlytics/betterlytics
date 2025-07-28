import { useMemo, useRef, useState, useEffect } from 'react';
import { Feature, Geometry } from 'geojson';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { scaleLinear } from 'd3-scale';
import { GeoVisitor } from '@/entities/geography';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { getCountryName } from '@/utils/countryCodes';
import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { FlagIconProps } from '@/components/icons';

interface UseLeafletFeaturesProps {
  visitorData: GeoVisitor[];
  calculatedMaxVisitors: number;
  mapLib?: typeof import('leaflet') | null;
}

export function useLeafletFeatures({ visitorData, calculatedMaxVisitors, mapLib }: UseLeafletFeaturesProps) {
  const [selectedCountry, setSelectedCountry] = useState<{ selectedAt: LatLng; code: string, visitors: number } | null>(null);
  const selectedCountryRef = useRef<typeof selectedCountry>(null);
  const previousSelectedCountryRef = useRef<typeof selectedCountry>(null);
  const featureLayersRef = useRef<Record<string, L.Layer>>({});

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 1, calculatedMaxVisitors])
      .range([MAP_VISITOR_COLORS.NO_VISITORS, MAP_VISITOR_COLORS.LOW_VISITORS, MAP_VISITOR_COLORS.HIGH_VISITORS]);
  }, [calculatedMaxVisitors]);

  const featureBorderColorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 1, calculatedMaxVisitors])
      .range([
        MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
        MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
        MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
      ]);
  }, [calculatedMaxVisitors]);

  const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
    feature?.id ? String(feature.id) : undefined;

  const styleGeoJson = (feature?: Feature<Geometry, GeoJSON.GeoJsonProperties>) => {
    if (!feature) return {};
    const featureId = getFeatureId(feature);
    const visitorEntry = visitorData.find((d) => d.country_code === featureId);
    const visitors = visitorEntry ? visitorEntry.visitors : 0;

    return {
      fillColor: colorScale(visitors),
      color: featureBorderColorScale(visitors),
      weight: visitors ? 1.5 : 1,
      fillOpacity: 0.8,
      opacity: 1,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;
  
    const visitorEntry = visitorData.find((d) => d.country_code === alpha2);
    const visitors = visitorEntry?.visitors ?? 0;
    
    featureLayersRef.current[alpha2] = layer;

    const handleSelect = (e: L.LeafletMouseEvent) => {
      setSelectedCountry({
        code: alpha2,
        selectedAt: e.latlng, // or layer.getBounds().getCenter() if you want center
        visitors: visitors
      });
    };
  
    layer.on({
      mouseover: handleSelect,
      click: handleSelect,
    });
  };

  useEffect(() => {
    const prev = previousSelectedCountryRef.current;
    const curr = selectedCountry;

    if (prev?.code === curr?.code) return;

    if (prev?.code && featureLayersRef.current[prev.code]) {
      const layer = featureLayersRef.current[prev.code] as L.Path;
      const visitorEntry = visitorData.find((d) => d.country_code === prev.code);
      const visitors = visitorEntry?.visitors ?? 0;

      layer.closePopup();
      layer.setStyle({
        fillColor: colorScale(visitors),
        color: featureBorderColorScale(visitors),
        weight: visitors ? 1.5 : 1,
        fillOpacity: 0.8,
        opacity: 1,
      });
    }

    if (curr?.code && featureLayersRef.current[curr.code]) {
      const layer = featureLayersRef.current[curr.code] as L.Path;
      const visitorEntry = visitorData.find((d) => d.country_code === curr.code);
      const visitors = visitorEntry?.visitors ?? 0;

      layer.setStyle({
        fillColor: colorScale(visitors),
        color: MAP_FEATURE_BORDER_COLORS.SELECTED,
        weight: 2.5,
        fillOpacity: 1,
        opacity: 1,
      });
    }

    selectedCountryRef.current = curr;
    previousSelectedCountryRef.current = curr;
  }, [selectedCountry, visitorData, colorScale, featureBorderColorScale]);

  return {
    selectedCountry,
    setSelectedCountry,
    onEachFeature,
    styleGeoJson,
  };
}
