'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import MapCard from '@/components/map/MapCard';
import { useMapInstance } from '@/components/map/MapProvider';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ZOOM_STEP = 0.3;
const CONTROLS = [
  { key: 'zoomIn', Icon: Plus, limit: 'hi' },
  { key: 'zoomOut', Icon: Minus, limit: 'lo' },
] as const;

export default function MapZoomButtons({ className }: { className?: string }) {
  const map = useMapInstance();
  const t = useTranslations('components.geography');
  const [limits, setLimits] = useState({ lo: true, hi: true });

  useEffect(() => {
    if (!map) {
      setLimits({ lo: true, hi: true });
      return;
    }
    const update = () =>
      setLimits({ lo: map.getZoom() <= map.getMinZoom(), hi: map.getZoom() >= map.getMaxZoom() });
    update();
    map.on('zoomend zoomlevelschange', update);
    return () => {
      map.off('zoomend zoomlevelschange', update);
    };
  }, [map]);

  return (
    <MapCard
      className={cn(
        'divide-border inline-flex flex-col divide-y *:first:rounded-b-none *:last:rounded-t-none',
        className,
      )}
    >
      {CONTROLS.map(({ key, Icon, limit }) => (
        <Button
          key={key}
          type='button'
          variant='ghost'
          size='icon'
          aria-label={t(key)}
          title={t(key)}
          aria-disabled={!map || limits[limit]}
          // aria-disabled keeps focus at the zoom limit
          className='relative cursor-pointer focus-visible:z-10 aria-disabled:pointer-events-none aria-disabled:opacity-50'
          onClick={() => {
            if (map && !limits[limit]) map[key](ZOOM_STEP);
          }}
        >
          <Icon />
        </Button>
      ))}
    </MapCard>
  );
}
