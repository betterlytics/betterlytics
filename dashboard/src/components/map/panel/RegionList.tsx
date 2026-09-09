'use client';

import type { GeoFeatureVisitor } from '@/entities/analytics/geography.entities';
import type { FeatureDisplayResolver } from '@/components/map/types';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import { formatNumber } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

type RegionListProps = {
  regions: GeoFeatureVisitor[];
  maxVisitors: number;
  resolveDisplay: FeatureDisplayResolver;
};

export default function RegionList({ regions, maxVisitors, resolveDisplay }: RegionListProps) {
  const t = useTranslations('components.geography');
  const locale = useLocale();
  const style = useMapStyle({ maxValue: maxVisitors || 1 });

  const sorted = useMemo(() => [...regions].sort((a, b) => b.visitors - a.visitors), [regions]);

  if (sorted.length === 0) {
    return <p className='text-muted-foreground py-4 text-sm'>{t('noData')}</p>;
  }

  return (
    <div>
      <h3 className='text-muted-foreground mb-2 text-sm font-medium'>{t('visitors')}</h3>
      <div className='space-y-0.5'>
        {sorted.map((region) => (
          <div key={region.code || 'unknown'} className='flex items-center justify-between py-1.5'>
            <div className='flex min-w-0 items-center gap-2'>
              <div
                className='h-2 w-2 shrink-0 rounded-full'
                style={{
                  backgroundColor: region.visitors
                    ? style.fillColorScale(region.visitors)
                    : 'var(--muted-foreground)',
                }}
              />
              <span className='truncate text-sm'>
                {region.code ? resolveDisplay(region.code).name : t('unknownRegion')}
              </span>
            </div>
            <span className='text-muted-foreground text-sm tabular-nums'>
              {formatNumber(region.visitors, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
