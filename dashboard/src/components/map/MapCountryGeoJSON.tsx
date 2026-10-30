import { useMapSelectionSetter, type MapFeatureVisitor } from '@/contexts/MapSelectionContextProvider';
import type { GeoFeatureVisitor, GeoFeatureVisitorWithCompare } from '@/entities/analytics/geography.entities';
import type { FeatureDisplayResolver } from '@/components/map/types';
import { MapStyle } from '@/hooks/use-leaflet-style';
import type { Feature, Geometry } from 'geojson';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { GeoJSON } from 'react-leaflet';
import MapTooltipContent from '@/components/map/tooltip/MapTooltipContent';
import MapPopupContent from '@/components/map/tooltip/MapPopupContent';
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
  hideWhenEmpty?: (featureId: string) => boolean;
  onFeatureClick?: (featureId: string) => void;
};

const DEFAULT_OPTS = {
  updateWhenIdle: true,
  buffer: 2,
  smoothFactor: 0.5,
};

const getFeatureId = (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>) =>
  feature?.id ? String(feature.id) : undefined;

type PopupHolder = HTMLElement & { _reactRoot?: Root; _resizeObserver?: ResizeObserver; _detached?: boolean };

// Leaflet sizes the popup on open, before React commits the content
function renderIntoPopup(layer: L.Layer, container: HTMLElement, node: React.ReactNode) {
  const holder = container as PopupHolder;
  holder._reactRoot ??= createRoot(container);
  holder._resizeObserver ??= new ResizeObserver(() => requestAnimationFrame(() => layer.getPopup()?.update()));
  holder._resizeObserver.observe(container);
  holder._reactRoot.render(node);
}

function stopObservingPopup(container: HTMLElement) {
  (container as PopupHolder)._resizeObserver?.disconnect();
}

// Removed inside another root's commit, so the unmount waits a tick; a re-add in between (StrictMode) keeps the root
function disposePopup(container: HTMLElement) {
  const holder = container as PopupHolder;
  holder._resizeObserver?.disconnect();
  holder._detached = true;
  queueMicrotask(() => {
    if (!holder._detached) return;
    holder._reactRoot?.unmount();
    holder._reactRoot = undefined;
  });
}

function keepPopup(container: HTMLElement) {
  (container as PopupHolder)._detached = false;
}

export default function MapCountryGeoJSON({
  GeoJSON,
  geoData,
  visitorData,
  compareData,
  size = 'sm',
  style,
  resolveDisplay,
  hideWhenEmpty,
  onFeatureClick,
}: MapCountryGeoJSONProps) {
  const { setMapSelection, registerFeature, markLayersReady } = useMapSelectionSetter();
  const locale = useLocale();
  const t = useTranslations('components');
  const timeRangeCtx = useTimeRangeContext();

  // Leaflet keeps the handlers it was given at layer creation
  const onFeatureClickRef = useRef(onFeatureClick);
  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
  }, [onFeatureClick]);

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

  const layerKey = `${dataVersion.current}-${timeRangeCtx.compareMode}-${locale}`;

  // Runs after the GeoJSON child has created its layers
  useEffect(() => {
    markLayersReady();
  }, [layerKey, markLayersReady]);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
      const featureId = getFeatureId(feature);
      if (!featureId) return;

      const geoVisitor = visitorsByCode.get(featureId) ?? { code: featureId, visitors: 0 };
      if (!geoVisitor.visitors && hideWhenEmpty?.(featureId)) {
        layer.setStyle({ opacity: 0, fillOpacity: 0 });
        registerFeature(featureId, null);
        return;
      }

      const geoVisitorWithComparison: GeoFeatureVisitorWithCompare = {
        ...geoVisitor,
        compareVisitors:
          timeRangeCtx.compareMode === 'off' ? undefined : (compareByCode.get(featureId)?.visitors ?? 0),
      };
      const entry: MapFeatureVisitor = {
        geoVisitor: geoVisitorWithComparison,
        layer,
        display: resolveDisplay(featureId),
      };
      registerFeature(featureId, entry);

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
          setMapSelection({ hovered: { ...entry, mousePosition } });
        },
        click: () => {
          setMapSelection({ clicked: entry });
          onFeatureClickRef.current?.(featureId);
        },
        popupopen: () => {
          renderIntoPopup(
            layer,
            popupContainer,
            size === 'lg' ? (
              <MapPopupContent
                locale={locale}
                geoVisitor={geoVisitorWithComparison}
                display={entry.display}
                size={size}
                t={t}
                timeRangeCtx={timeRangeCtx}
                onMouseEnter={() => setMapSelection({ hovered: undefined })}
              />
            ) : (
              <MapTooltipContent
                locale={locale}
                geoVisitor={geoVisitorWithComparison}
                display={entry.display}
                size={size}
                label={t('geography.visitors')}
                onMouseEnter={() => setMapSelection({ hovered: undefined })}
              />
            ),
          );
        },
        popupclose: () => stopObservingPopup(popupContainer),
        add: () => keepPopup(popupContainer),
        remove: () => disposePopup(popupContainer),
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
      registerFeature,
      resolveDisplay,
      hideWhenEmpty,
    ],
  );

  return <GeoJSON key={layerKey} data={geoData} onEachFeature={onEachFeature} {...DEFAULT_OPTS} />;
}
