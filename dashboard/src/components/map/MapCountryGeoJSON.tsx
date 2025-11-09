import { useMapSelectionSetter } from '@/contexts/MapSelectionContextProvider';
import type { WorldMapResponse, GeoVisitorWithCompare } from '@/entities/geography';
import { MapStyle } from '@/hooks/use-leaflet-style';
import type { Feature, Geometry } from 'geojson';
import React, { useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { GeoJSON } from 'react-leaflet';
import MapTooltipContent from './tooltip/MapTooltipContent';
import MapPopupContent from './popup/MapPopupContent';
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

  useEffect(() => {
    setMapSelection(null);
  }, [visitorData, compareData, setMapSelection]);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
      const country_code = getFeatureId(feature);
      if (!country_code) return;

      const geoVisitor = visitorData.find((d) => d.country_code === country_code) ?? { country_code, visitors: 0 };
      const compareVisitor = compareData.find((d) => d.country_code === country_code);

      const geoVisitorWithComparison: GeoVisitorWithCompare = {
        ...geoVisitor,
        compareVisitors: compareData.length === 0 ? undefined : (compareVisitor?.visitors ?? 0),
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
    [size, style, visitorData, compareData, locale, t, timeRangeCtx, setMapSelection],
  );

  return (
    <GeoJSON
      key={`${visitorData.length}-${locale}`}
      data={geoData}
      onEachFeature={onEachFeature}
      {...DEFAULT_OPTS}
    />
  );
}
