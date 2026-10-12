'use client';

import { useEffect, useState } from 'react';
import type { Map as LeafletMapInstance } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

// The map's own zoomDelta is 0.1, too small a step for a button; the wheel keeps its own rate
const ZOOM_STEP = 0.3;
// aria-disabled instead of disabled so a focused button keeps focus when it reaches the zoom limit
const LIMIT_CLASS = 'aria-disabled:pointer-events-none aria-disabled:opacity-50';

export default function MapZoomButtons({ map }: { map: LeafletMapInstance | null }) {
  const t = useTranslations('components.geography');
  const [limits, setLimits] = useState({ atMin: true, atMax: true });

  useEffect(() => {
    if (!map) {
      setLimits({ atMin: true, atMax: true });
      return;
    }
    const update = () =>
      setLimits({ atMin: map.getZoom() <= map.getMinZoom(), atMax: map.getZoom() >= map.getMaxZoom() });
    update();
    map.on('zoomend zoomlevelschange', update);
    return () => {
      map.off('zoomend zoomlevelschange', update);
    };
  }, [map]);

  return (
    <div className='bg-card flex flex-col rounded-md shadow-md'>
      <Button
        variant='ghost'
        size='icon'
        aria-label={t('zoomIn')}
        title={t('zoomIn')}
        aria-disabled={!map || limits.atMax}
        className={LIMIT_CLASS}
        onClick={() => {
          if (map && !limits.atMax) map.zoomIn(ZOOM_STEP);
        }}
      >
        <Plus />
      </Button>
      <Separator />
      <Button
        variant='ghost'
        size='icon'
        aria-label={t('zoomOut')}
        title={t('zoomOut')}
        aria-disabled={!map || limits.atMin}
        className={LIMIT_CLASS}
        onClick={() => {
          if (map && !limits.atMin) map.zoomOut(ZOOM_STEP);
        }}
      >
        <Minus />
      </Button>
    </div>
  );
}
