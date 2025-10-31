'use client';

import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoVisitorWithCompare } from '@/contexts/DeckGLSelectionContextProvider';
import { TimeRangeContextProps, useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { cn } from '@/lib/utils';
import { getCountryName } from '@/utils/countryCodes';
import { formatNumber } from '@/utils/formatters';
import React, { useMemo } from 'react';
import { DateTimeSliderLabel } from '@/components/map/deckgl/controls/DateTimeSliderLabel';
import { formatPrimaryRangeLabel } from '@/utils/formatPrimaryRangeLabel';
import { useLocale, useTranslations } from 'next-intl';

// Receive compare start/end/granularity as prop to avoid refetching
export type MapPopupContentProps = {
  geoVisitor?: GeoVisitorWithCompare;
  className?: string;
  locale: SupportedLanguages;
  size: 'sm' | 'lg';
  isTimeseries?: boolean;
  timeRangeCtx: TimeRangeContextProps;
};

function MapPopupContentComponent({
  geoVisitor,
  size,
  className,
  locale,
  isTimeseries,
  timeRangeCtx,
}: MapPopupContentProps) {
  const hasComparison = Boolean(
    geoVisitor &&
      geoVisitor.compare?.compareVisitors &&
      geoVisitor.compare?.compareDate &&
      geoVisitor.compare.dProcent &&
      (geoVisitor.date || !isTimeseries),
  );
  const t = useTranslations('components');

  const accComparison = useMemo(() => {
    return (
      hasComparison &&
      geoVisitor?.visitors &&
      timeRangeCtx.interval !== 'custom' &&
      timeRangeCtx.offset === 0 && (
        <>
          <div className='flex flex-col space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <div className='bg-primary h-2 w-2 rounded-full' />
                <span
                  title={`${timeRangeCtx.startDate.toLocaleString()} - ${timeRangeCtx.endDate.toLocaleString()}`}
                >
                  {t(`timeRange.presets.${timeRangeCtx.interval}`)}
                </span>
              </div>
              <div className='font-medium'>{formatNumber(geoVisitor.visitors)}</div>
            </div>
            {timeRangeCtx.compareStartDate && timeRangeCtx.compareEndDate && (
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <div className='bg-chart-comparison h-2 w-2 rounded-full' />
                  <span
                    className='text-muted-foreground'
                    title={`${timeRangeCtx.compareStartDate.toLocaleString()} - ${timeRangeCtx.compareEndDate.toLocaleString()}`}
                  >
                    {t('timeRange.previousPeriod')}
                  </span>
                </div>
                <div className='text-muted-foreground'>{formatNumber(geoVisitor?.compare?.compareVisitors!)}</div>
              </div>
            )}
          </div>
        </>
      )
    );
  }, [
    timeRangeCtx.compareStartDate,
    timeRangeCtx.compareEndDate,
    timeRangeCtx.interval,
    timeRangeCtx.offset,
    hasComparison,
    t,
    geoVisitor?.visitors,
    geoVisitor?.compare?.compareVisitors,
  ]);
  const timeseriesComparison = useMemo(() => {
    return (
      geoVisitor &&
      hasComparison && (
        <>
          <div className='flex flex-col space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <div className='bg-primary h-2 w-2 rounded-full' />
                <DateTimeSliderLabel
                  value={geoVisitor.date!}
                  granularity={timeRangeCtx.granularity}
                  animate={false}
                />
              </div>
              <div className='font-medium'>{formatNumber(geoVisitor.visitors)}</div>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <div className='bg-chart-comparison h-2 w-2 rounded-full' />
                <DateTimeSliderLabel
                  value={geoVisitor.compare.compareDate!}
                  granularity={timeRangeCtx.granularity}
                  animate={false}
                  className='text-muted-foreground'
                />
              </div>
              <div className='text-muted-foreground'>{formatNumber(geoVisitor.compare?.compareVisitors!)}</div>
            </div>
          </div>
        </>
      )
    );
  }, [timeRangeCtx.granularity, geoVisitor?.visitors, geoVisitor?.compare.compareDate]);
  if (!geoVisitor) return null;
  return (
    <div
      className={cn(
        'border-border bg-popover/95 min-w-[200px] rounded-lg border p-3 shadow-xl backdrop-blur-sm',
        'text-foreground flex flex-col space-y-1 text-sm',
        size === 'sm' ? 'max-w-[300px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <CountryDisplay
        className='justify-center text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <div className='border-border my-2 border-t'></div>

      <div className='flex items-center justify-start gap-1'>
        <div className='text-muted-foreground flex items-center gap-0.5'>
          <span>{t('geography.visitors')}</span>
          {!hasComparison && ':'}
        </div>
        {!hasComparison && <span className='text-foreground'>{formatNumber(geoVisitor.visitors ?? 0)}</span>}
        {hasComparison && (
          <div className='flex items-center gap-0'>
            <TrendPercentage percentage={geoVisitor.compare.dProcent} withParenthesis withIcon />
          </div>
        )}
      </div>
      {isTimeseries ? timeseriesComparison : accComparison}
    </div>
  );
}

const MapPopupContent = React.memo(MapPopupContentComponent);
MapPopupContent.displayName = 'MapPopupContent';

export default MapPopupContent;
