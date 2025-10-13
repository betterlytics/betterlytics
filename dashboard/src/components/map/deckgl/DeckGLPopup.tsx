import { WebMercatorViewport } from '@deck.gl/core';
import { useMapSelectionActions, useMapSelectionState } from '@/contexts/DeckGLSelectionContextProvider';
import MapTooltipContent from '../tooltip/MapTooltipContent';
import MapTooltipTip from '../tooltip/MapTooltipTip';
import { cn } from '@/lib/utils';
import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMapViewState } from '@/contexts/DeckGLViewStateProvider';

interface DeckGLPopupProps {
  size?: 'sm' | 'lg';
  children?: React.ReactNode;
}

function DeckGLPopupComponent({ size = 'sm', children }: DeckGLPopupProps) {
  const viewState = useMapViewState();
  const { clickedFeatureRef } = useMapSelectionActions();
  const { clicked } = useMapSelectionState();
  const locale = useLocale();
  const t = useTranslations('components.geography');

  const clickedFeature = clickedFeatureRef?.current;
  if (!clickedFeature || !clicked || !viewState) return null;

  const viewport = new WebMercatorViewport(viewState);
  const featureLatLng: [number, number] = [clickedFeature.longitude ?? 0, clickedFeature.latitude ?? 0];
  const [x, y] = viewport.project(featureLatLng);

  return (
    <section
      role='tooltip'
      aria-hidden={false}
      style={{
        left: x,
        top: y - 60,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'auto',
      }}
      className={cn(
        'rounded-md',
        'deckgl-popup leaflet-popup-content-wrapper',
        'pointer-events-none absolute z-[11] flex flex-col will-change-transform',
      )}
    >
      <div className='leaflet-popup-content'>
        <MapTooltipContent
          geoVisitor={clickedFeature?.geoVisitor}
          size={size}
          locale={locale}
          label={t('visitors')}
        />
        {children}
      </div>
      <MapTooltipTip />
    </section>
  );
}

export const DeckGLPopup = React.memo(DeckGLPopupComponent);
