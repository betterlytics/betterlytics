'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMapInstance } from '@/components/map/MapProvider';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ZOOM_STEP = 0.3;
// aria-disabled keeps focus at the zoom limit
const BUTTON_CLASS =
  'relative cursor-pointer focus-visible:z-10 aria-disabled:pointer-events-none aria-disabled:opacity-50';

export default function MapZoomButtons({ className }: { className?: string }) {
  const map = useMapInstance();
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
    <div
      className={cn(
        'bg-card border-border divide-border inline-flex flex-col divide-y rounded-md border shadow-md dark:bg-(--card-interactive)',
        className,
      )}
    >
      <Button
        variant='ghost'
        size='icon'
        aria-label={t('zoomIn')}
        title={t('zoomIn')}
        aria-disabled={!map || limits.atMax}
        className={`${BUTTON_CLASS} rounded-b-none`}
        onClick={() => {
          if (map && !limits.atMax) map.zoomIn(ZOOM_STEP);
        }}
      >
        <Plus />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        aria-label={t('zoomOut')}
        title={t('zoomOut')}
        aria-disabled={!map || limits.atMin}
        className={`${BUTTON_CLASS} rounded-t-none`}
        onClick={() => {
          if (map && !limits.atMin) map.zoomOut(ZOOM_STEP);
        }}
      >
        <Minus />
      </Button>
    </div>
  );
}
