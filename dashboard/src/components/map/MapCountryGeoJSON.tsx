import { useMapSelectionSetter } from '@/contexts/MapSelectionContextProvider';
import type { WorldMapResponse, GeoVisitorWithCompare } from '@/entities/analytics/geography.entities';
import { MapStyle } from '@/hooks/use-leaflet-style';
import type { Feature, Geometry } from 'geojson';
import React, { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { GeoJSON } from 'react-leaflet';
import MapTooltipContent from './tooltip/MapTooltipContent';
import MapPopupContent from './tooltip/MapPopupContent';
import { useLocale, useTranslations } from 'next-intl';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type MapCountryGeoJSONProps = Omit<WorldMapResponse, 'maxVisitors'> & {
  GeoJSON: typeof GeoJSON;
  geoData: GeoJSON.FeatureCollection;
  style: MapStyle;
  size?: 'sm' | 'lg';
};

const DEFAULT_OPTS = {
  updateWhenIdle: true,
  buffer: 2,
  smoothFactor: 0.5,
};

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

export default function MapCountryGeoJSON({
  GeoJSON,
  geoData,
  visitorData,
  compareData,
  size = 'sm',
  style,
}: MapCountryGeoJSONProps) {
  const { setMapSelection } = useMapSelectionSetter();
  const locale = useLocale();
  const t = useTranslations('components');
  const timeRangeCtx = useTimeRangeContext();

  const dataVersion = useRef(0);
  const prevData = useRef({ visitorData, compareData });
  if (prevData.current.visitorData !== visitorData || prevData.current.compareData !== compareData) {
    dataVersion.current++;
    prevData.current = { visitorData, compareData };
  }

  useEffect(() => {
    setMapSelection(null);
  }, [visitorData, compareData, setMapSelection]);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
      const country_code = getFeatureId(feature);
      if (!country_code) return;

      let geoVisitor = visitorData.find((d) => d.country_code === country_code);
      if (!geoVisitor) {
        geoVisitor = { country_code, visitors: 0 };
      }
      const compareVisitor = compareData.find((d) => d.country_code === country_code);

      const geoVisitorWithComparison: GeoVisitorWithCompare = {
        ...geoVisitor,
        compareVisitors: timeRangeCtx.compareMode === 'off' ? undefined : (compareVisitor?.visitors ?? 0),
      };

      const popupContainer = document.createElement('div');

      layer.setStyle(style.originalStyle(geoVisitor.visitors));
      layer.unbindTooltip();
      layer.unbindPopup();

      layer.bindPopup(popupContainer, {
        autoPan: true,
        autoPanPadding: [25, 10],
        closeButton: false,
      });

      layer.on({
        mouseover: (e) => {
          const mousePosition = e.originalEvent
            ? { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
            : undefined;
          setMapSelection({ hovered: { geoVisitor: geoVisitorWithComparison, layer, mousePosition } });
        },
        click: () => {
          setMapSelection({ clicked: { geoVisitor: geoVisitorWithComparison, layer } });
        },
        popupopen: () => {
          if (!(popupContainer as any)._reactRoot) {
            (popupContainer as any)._reactRoot = createRoot(popupContainer);
          }

          (popupContainer as any)._reactRoot.render(
            size === 'lg' ? (
              <MapPopupContent
                locale={locale}
                geoVisitor={geoVisitorWithComparison}
                size={size}
                t={t}
                timeRangeCtx={timeRangeCtx}
                onMouseEnter={() => setMapSelection({ hovered: undefined })}
              />
            ) : (
              <MapTooltipContent
                locale={locale}
                geoVisitor={geoVisitorWithComparison}
                size={size}
                label={t('geography.visitors')}
                onMouseEnter={() => setMapSelection({ hovered: undefined })}
              />
            ),
          );

          requestAnimationFrame(() => {
            layer.getPopup()?.update();
          });
        },
      });
    },
    [
      size,
      style.borderColorScale,
      style.fillColorScale,
      visitorData,
      compareData,
      locale,
      t,
      timeRangeCtx,
      setMapSelection,
    ],
  );

  // An invisible path still catches clicks and hovers, so an empty Antarctica is left out entirely
  const keepFeature = useCallback(
    (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
      getFeatureId(feature) !== 'AQ' || visitorData.some((d) => d.country_code === 'AQ' && d.visitors > 0),
    [visitorData],
  );

  return (
    <GeoJSON
      key={`${dataVersion.current}-${timeRangeCtx.compareMode}-${locale}`}
      data={geoData}
      filter={keepFeature}
      onEachFeature={onEachFeature}
      {...DEFAULT_OPTS}
    />
  );
}
