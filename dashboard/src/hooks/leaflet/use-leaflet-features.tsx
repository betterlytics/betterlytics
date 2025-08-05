import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Feature, Geometry } from 'geojson';
import { scaleLinear } from 'd3-scale';
import { GeoVisitor } from '@/entities/geography';
import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { getTooltipId } from '@/components/leaflet/tooltip/MapStickyTooltip';
import { useIsMobile } from '../use-mobile';
import MapTooltipContent from '@/components/leaflet/tooltip/MapTooltipContent';
import { LeafletStyle, useLeafletStyle } from './use-leaflet-style';
import { useMapSelection } from '@/contexts/MapSelectionProvider';

//! TODO: Split this into three files:
// useMobileLeafletFeatures
// useDesktopLeafletFeatures
// useLeafletFeatures # Responsible for rendering correct feature and clean up when switching between desktop / mobile
interface UseLeafletFeaturesProps {
  visitorData: GeoVisitor[];
  style: LeafletStyle;
  size: 'sm' | 'lg';
}

//! TODO: Share type
type LeafletVisitor = {
  geoVisitor: GeoVisitor;
  layer: L.Polygon;
};

export function useLeafletFeatures({ visitorData, style, size }: UseLeafletFeaturesProps) {
  const { selectedFeature, setHoveredFeature, hoveredFeature, setSelectedFeature } = useMapSelection();
  const visitorRef = useRef<LeafletVisitor | undefined>(undefined);
  const isMobile = useIsMobile();

  const selectFeature = (geoVisitor: GeoVisitor, layer: L.Polygon) => {
    if (geoVisitor.country_code === visitorRef.current?.geoVisitor.country_code) return;

    layer.bringToFront();
    layer.setStyle(style.selectedStyle(geoVisitor.visitors));

    const newVisitor = { geoVisitor, layer };
    // if (visitor !== newVisitor) {
    //   setVisitor(newVisitor);
    // }
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

        visitorRef.current?.layer?.setStyle(style.originalStyle(visitorRef.current.geoVisitor.visitors));
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
        layer.setStyle(style.originalStyle(geoVisitor.visitors));
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
    layer.setStyle(style.originalStyle(visitorEntry.visitors));
    isMobile ? mobileFeatureHandler(visitorEntry, layer) : desktopFeatureHandler(visitorEntry, layer);
  };

  return {
    onEachFeature,
  };
}
