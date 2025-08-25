import { useMapSelection } from '@/contexts/MapSelectionContextProvider';
import { GeoVisitor } from '@/entities/geography';
import { MapStyle } from '@/hooks/use-leaflet-style';
import type { Feature, Geometry } from 'geojson';
import React, { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { GeoJSON } from 'react-leaflet';
import MapTooltipContent from './tooltip/MapTooltipContent';
import { useLocale, useTranslations } from 'next-intl';

interface MapCountryGeoJSONProps {
  GeoJSON: typeof GeoJSON;
  geoData: GeoJSON.FeatureCollection;
  visitorData: GeoVisitor[];
  style: MapStyle;
  size?: 'sm' | 'lg';
}

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
  size = 'sm',
  style,
}: MapCountryGeoJSONProps) {
  const { setMapSelection } = useMapSelection();
  const locale = useLocale();
  const t = useTranslations('components.geography');
  const ref = useRef({ setMapSelection });
  useEffect(() => {
    ref.current = { setMapSelection };
  }, [setMapSelection]);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJSON.GeoJsonProperties>, layer: L.Polygon) => {
      const country_code = getFeatureId(feature);
      if (!country_code) return;

      let geoVisitor = visitorData.find((d) => d.country_code === country_code);
      if (!geoVisitor) {
        geoVisitor = { country_code, visitors: 0 };
      }

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
        mouseover: () => {
          ref.current.setMapSelection({ hovered: { geoVisitor, layer } });
        },
        click: () => {
          ref.current.setMapSelection({ clicked: { geoVisitor, layer } });
        },
        popupopen: () => {
          if (!(popupContainer as any)._reactRoot) {
            (popupContainer as any)._reactRoot = createRoot(popupContainer);
          }
          (popupContainer as any)._reactRoot.render(
            <MapTooltipContent locale={locale} geoVisitor={geoVisitor} size={size} label={t('visitors')} />,
          );

          requestAnimationFrame(() => {
            layer.getPopup()?.update();
          });
        },
      });
    },
    [size, style, visitorData],
  );

  return <GeoJSON key={visitorData.length} data={geoData} onEachFeature={onEachFeature} {...DEFAULT_OPTS} />;
}
