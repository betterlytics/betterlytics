import { useCallback, useMemo, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Feature, Geometry } from 'geojson';
import { scaleLinear } from 'd3-scale';
import { GeoVisitor } from '@/entities/geography';
import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { getTooltipId } from '@/components/leaflet/tooltip/MapStickyTooltip';
import { useIsMobile } from './use-mobile';
import { MapTooltip } from '@/components/leaflet/tooltip';

interface UseLeafletFeaturesProps {
  visitorData: GeoVisitor[];
  calculatedMaxVisitors: number;
}

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

type LeafletVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

export function useLeafletFeatures({ visitorData, calculatedMaxVisitors }: UseLeafletFeaturesProps) {
  const [visitor, setVisitor] = useState<LeafletVisitor | undefined>();
  const [prvVisitor, setPrvVisitor] = useState<LeafletVisitor>();
  const isMobile = useIsMobile();

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
    [MAP_FEATURE_BORDER_COLORS, originalStyle],
  );

  const selectFeature = (geoVisitor: GeoVisitor, layer: L.Polygon) => {
    console.log('Selecting: ', geoVisitor, ` current:${visitor?.geoVisitor} prv:${prvVisitor?.geoVisitor}`);
    if (geoVisitor?.country_code === visitor?.geoVisitor.country_code) return;
    layer.bringToFront();
    layer.setStyle(selectedStyle(geoVisitor.visitors));
    setPrvVisitor(visitor);
    setVisitor({ geoVisitor: geoVisitor, layer });
  };

  const mobileFeatureHandler = (geoVisitor: GeoVisitor | undefined, layer: L.Polygon) => {
    if (!geoVisitor) return;
    const popupHtml = renderToString(<MapTooltip geoVisitor={visitor?.geoVisitor} size={'sm'} />);

    layer.bindPopup(popupHtml, {
      autoPan: true,
      autoPanPadding: [25, 10],
    });

    layer.on({
      click: (e: L.LeafletMouseEvent) => {
        console.log('Mobile click!!');
        if (geoVisitor?.country_code === visitor?.geoVisitor.country_code) return;

        if (prvVisitor) {
          console.log('Have prv visitor!!');
        }
        prvVisitor?.layer.bringToBack();
        prvVisitor?.layer?.setStyle(originalStyle(geoVisitor.visitors));
        prvVisitor?.layer?.closePopup();
        layer.openPopup(e.latlng);

        selectFeature(geoVisitor, layer);
      },
    });
  };

  const desktopFeatureHandler = (geoVisitor: GeoVisitor | undefined, layer: L.Polygon) => {
    console.log('Using desktop feature handler!!');
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
      },
    });
  };

  const onEachFeature = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
    const alpha2 = getFeatureId(feature);
    if (!alpha2) return;
    const visitorEntry = visitorData.find((d) => d.country_code === alpha2);
    if (visitorEntry) layer.setStyle(originalStyle(visitorEntry?.visitors));

    // Unbind built in tooltip and popup
    layer.unbindTooltip();
    layer.unbindPopup();

    return isMobile ? desktopFeatureHandler(visitorEntry, layer) : mobileFeatureHandler(visitorEntry, layer);
  };

  return {
    visitor: visitor,
    setVisitor: setVisitor,
    onEachFeature,
  };
}
