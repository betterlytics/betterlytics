import { useMapSelectionSetter } from '@/contexts/MapSelectionContextProvider';
import type { GeoFeatureVisitor, GeoFeatureVisitorWithCompare } from '@/entities/analytics/geography.entities';
import type { FeatureDisplayResolver } from '@/components/map/types';
import { MapStyle } from '@/hooks/use-leaflet-style';
import type { Feature, Geometry } from 'geojson';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { GeoJSON } from 'react-leaflet';
import MapTooltipContent from './tooltip/MapTooltipContent';
import MapPopupContent from './tooltip/MapPopupContent';
import { useLocale, useTranslations } from 'next-intl';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type MapCountryGeoJSONProps = {
  GeoJSON: typeof GeoJSON;
  geoData: GeoJSON.FeatureCollection;
  visitorData: GeoFeatureVisitor[];
  compareData: GeoFeatureVisitor[];
  style: MapStyle;
  size?: 'sm' | 'lg';
  resolveDisplay: FeatureDisplayResolver;
  shouldHideFeature?: (featureId: string) => boolean;
  onFeatureClick?: (featureId: string) => void;
};

const DEFAULT_OPTS = {
  updateWhenIdle: true,
  buffer: 2,
  smoothFactor: 0.5,
};

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

function renderIntoPopup(container: HTMLElement, node: React.ReactNode) {
  const holder = container as HTMLElement & { _reactRoot?: Root };
  holder._reactRoot ??= createRoot(container);
  holder._reactRoot.render(node);
}

export default function MapCountryGeoJSON({
  GeoJSON,
  geoData,
  visitorData,
  compareData,
  size = 'sm',
  style,
  resolveDisplay,
  shouldHideFeature,
  onFeatureClick,
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

  const visitorsByCode = useMemo(() => new Map(visitorData.map((d) => [d.code, d])), [visitorData]);
  const compareByCode = useMemo(() => new Map(compareData.map((d) => [d.code, d])), [compareData]);

  useEffect(() => {
    setMapSelection(null);
  }, [visitorData, compareData, setMapSelection]);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
      const featureId = getFeatureId(feature);
      if (!featureId) return;

      const geoVisitor = visitorsByCode.get(featureId) ?? { code: featureId, visitors: 0 };
      if (!geoVisitor.visitors && shouldHideFeature?.(featureId)) {
        layer.setStyle({ opacity: 0, fillOpacity: 0 });
        return;
      }
      const compareVisitor = compareByCode.get(featureId);

      const geoVisitorWithComparison: GeoFeatureVisitorWithCompare = {
        ...geoVisitor,
        compareVisitors: timeRangeCtx.compareMode === 'off' ? undefined : (compareVisitor?.visitors ?? 0),
      };

      const display = resolveDisplay(featureId);
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
          onFeatureClick?.(featureId);
        },
        popupopen: () => {
          renderIntoPopup(
            popupContainer,
            size === 'lg' ? (
              <MapPopupContent
                locale={locale}
                geoVisitor={geoVisitorWithComparison}
                displayName={display.name}
                displayCountryCode={display.countryCode}
                size={size}
                t={t}
                timeRangeCtx={timeRangeCtx}
                onMouseEnter={() => setMapSelection({ hovered: undefined })}
              />
            ) : (
              <MapTooltipContent
                locale={locale}
                geoVisitor={geoVisitorWithComparison}
                displayName={display.name}
                displayCountryCode={display.countryCode}
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
      visitorsByCode,
      compareByCode,
      locale,
      t,
      timeRangeCtx,
      setMapSelection,
      resolveDisplay,
      shouldHideFeature,
      onFeatureClick,
    ],
  );

  return (
    <GeoJSON
      key={`${dataVersion.current}-${timeRangeCtx.compareMode}-${locale}`}
      data={geoData}
      onEachFeature={onEachFeature}
      {...DEFAULT_OPTS}
    />
  );
}
