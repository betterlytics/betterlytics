import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Feature, Geometry } from 'geojson';
import { scaleLinear } from 'd3-scale';
import { GeoVisitor } from '@/entities/geography';
import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { getTooltipId } from '@/components/leaflet/tooltip/MapStickyTooltip';
import { useIsMobile } from './use-mobile';
import MapTooltipContent from '@/components/leaflet/tooltip/MapTooltipContent';

//! TODO: Split this into three files:
// useMobileLeafletFeatures
// useDesktopLeafletFeatures
// useLeafletFeatures # Responsible for rendering correct feature and clean up when switching between desktop / mobile
interface UseLeafletFeaturesProps {
  visitorData: GeoVisitor[];
  calculatedMaxVisitors: number;
  size: 'sm' | 'lg';
}

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

type LeafletVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

export function useLeafletFeatures({ visitorData, calculatedMaxVisitors, size }: UseLeafletFeaturesProps) {
  const [visitor, setVisitor] = useState<LeafletVisitor | undefined>();
  const visitorRef = useRef<LeafletVisitor | undefined>(undefined);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && visitor !== visitorRef.current) {
      visitorRef.current?.layer?.setStyle(originalStyle(visitorRef.current.geoVisitor.visitors));
      visitorRef.current?.layer?.closePopup();
      if (visitor) {
        selectFeature(visitor.geoVisitor, visitor.layer);
      } else {
        visitorRef.current = undefined;
      }
    }
  }, [visitor]);

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

  const originalStyle = useCallback(
    (visitors: number) => ({
      fillColor: colorScale(visitors),
      color: featureBorderColorScale(visitors),
      weight: visitors ? 1.5 : 1,
      fillOpacity: 0.8,
      opacity: 1,
    }),
    [featureBorderColorScale, colorScale],
  );

  const selectedStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      color: MAP_FEATURE_BORDER_COLORS.SELECTED,
      weight: 2.5,
      fillOpacity: 1,
    }),
    [originalStyle],
  );

  const selectFeature = (geoVisitor: GeoVisitor, layer: L.Polygon) => {
    if (geoVisitor.country_code === visitorRef.current?.geoVisitor.country_code) return;

    layer.bringToFront();
    layer.setStyle(selectedStyle(geoVisitor.visitors));

    const newVisitor = { geoVisitor, layer };
    if (visitor !== newVisitor) {
      setVisitor(newVisitor);
    }
    visitorRef.current = newVisitor;
  };

  const mobileFeatureHandler = (geoVisitor: GeoVisitor | undefined, layer: L.Polygon) => {
    if (!geoVisitor) return;

    const popupHtml = renderToString(<MapTooltipContent geoVisitor={geoVisitor} size={size} className='' />);

    layer.bindPopup(popupHtml, {
      autoPan: true,
      autoPanPadding: [25, 10],
      closeButton: false,
    });

    layer.on({
      click: () => {
        if (geoVisitor.country_code === visitorRef.current?.geoVisitor.country_code) return;

        visitorRef.current?.layer?.setStyle(originalStyle(visitorRef.current.geoVisitor.visitors));
        visitorRef.current?.layer?.closePopup();
        layer.openPopup();
        selectFeature(geoVisitor, layer);
      },
    });
  };

  const desktopFeatureHandler = (geoVisitor: GeoVisitor | undefined, layer: L.Polygon) => {
    layer.unbindTooltip();
    layer.unbindPopup();

    if (!geoVisitor) return;

    const element = layer.getElement();
    if (element) {
      element.setAttribute('aria-describedby', getTooltipId(geoVisitor.country_code));
    }

    layer.on({
      mouseover: () => {
        selectFeature(geoVisitor, layer);
      },
      mouseout: () => {
        layer.setStyle(originalStyle(geoVisitor.visitors));
        setVisitor(undefined);
        visitorRef.current = undefined;
      },
    });
  };

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;

    let visitorEntry = visitorData.find((d) => d.country_code === alpha2);
    if (!visitorEntry) {
      visitorEntry = { country_code: alpha2, visitors: 0 };
    }
    layer.setStyle(originalStyle(visitorEntry.visitors));
    isMobile ? mobileFeatureHandler(visitorEntry, layer) : desktopFeatureHandler(visitorEntry, layer);
  };

  return {
    visitor,
    setVisitor,
    onEachFeature,
  };
}
