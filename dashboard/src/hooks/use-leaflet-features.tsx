import { useMemo, useState } from 'react';
import { Feature, Geometry } from 'geojson';
import { scaleLinear } from 'd3-scale';
import { GeoVisitor } from '@/entities/geography';
import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { getTooltipId } from '@/components/leaflet/MapTooltip';

interface UseLeafletFeaturesProps {
  visitorData: GeoVisitor[];
  calculatedMaxVisitors: number;
}

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

export function useLeafletFeatures({ visitorData, calculatedMaxVisitors }: UseLeafletFeaturesProps) {
  const [selectedCountry, setSelectedCountry] = useState<{ code: string; visitors: number } | null>(null);

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

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;

    const visitorEntry = visitorData.find((d) => d.country_code === alpha2);
    const visitors = visitorEntry?.visitors ?? 0;
    const og_style = {
      fillColor: colorScale(visitors),
      color: featureBorderColorScale(visitors),
      weight: visitors ? 1.5 : 1,
      fillOpacity: 0.8,
      opacity: 1,
    };

    layer.setStyle(og_style);

    const selectCountry = () => {
      if (selectedCountry?.code === alpha2) return;
      layer.bringToFront();
      layer.setStyle({
        ...og_style,
        color: MAP_FEATURE_BORDER_COLORS.SELECTED,
        weight: 2.5,
        fillOpacity: 1,
      });

      setSelectedCountry({
        code: alpha2,
        visitors,
      });
    };

    const ele = layer.getElement();
    if (ele) {
      ele.setAttribute('aria-describedby', getTooltipId(alpha2));
    }

    // Unbind built in tooltip and popup
    layer.unbindTooltip();
    layer.unbindPopup();

    layer.on({
      mouseover: selectCountry,
      click: selectCountry,
      mouseout: () => {
        layer.setStyle(og_style);
        setSelectedCountry(null);
      },
    });
  };

  return {
    selectedCountry,
    setSelectedCountry,
    onEachFeature,
  };
}
