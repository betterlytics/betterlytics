import { cssVar, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { useMapSelectionSetter } from '@/contexts/MapSelectionContextProvider';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import React, { useCallback } from 'react';

type MapLegendProps = {
  maxVisitors?: number;
  className?: string;
};

function MapLegendComponent({ maxVisitors = 1, className }: MapLegendProps) {
  const locale = useLocale();
  const t = useTranslations('components.geography');
  const { setMapSelection } = useMapSelectionSetter();

  // Covered map paths never fire mouseout
  const clearHovered = useCallback(() => {
    setMapSelection({ hovered: undefined });
  }, [setMapSelection]);

  return (
    <div
      data-map-overlay='bottom'
      className={cn(
        'border-border bg-card rounded-md border p-2.5 text-xs leading-normal shadow-md dark:bg-(--card-interactive)',
        className,
      )}
      onMouseEnter={clearHovered}
    >
      <h4 className='text-foreground mb-1.5 font-medium'>{t('visitors')}</h4>
      <div className='flex items-center'>
        <span className='text-muted-foreground mr-1 text-xs'>0</span>
        <div
          className='h-2 w-24 rounded'
          style={{
            background: `linear-gradient(to right, ${cssVar(MAP_VISITOR_COLORS.NO_VISITORS)} 0%, ${cssVar(MAP_VISITOR_COLORS.LOW_VISITORS)} 3%, ${cssVar(MAP_VISITOR_COLORS.HIGH_VISITORS)} 100%)`,
          }}
        ></div>
        <span className='text-muted-foreground ml-1 text-xs'>{formatNumber(maxVisitors, locale)}</span>
      </div>
    </div>
  );
}

const MapLegend = React.memo(MapLegendComponent);
MapLegend.displayName = 'MapLegend';

export default MapLegend;
