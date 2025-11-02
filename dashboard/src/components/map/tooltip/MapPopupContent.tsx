'use client';

import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { DateTimeSliderLabel } from '@/components/map/deckgl/controls/DateTimeSliderLabel';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoVisitorWithCompare } from '@/contexts/DeckGLSelectionContextProvider';
import { TimeRangeContextProps } from '@/contexts/TimeRangeContextProvider';
import { cn } from '@/lib/utils';
import { getCountryName } from '@/utils/countryCodes';
import { formatPrimaryRangeLabel } from '@/utils/formatPrimaryRangeLabel';
import { formatNumber } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import React from 'react';

export type MapPopupContentProps = {
  geoVisitor?: GeoVisitorWithCompare;
  className?: string;
  locale: SupportedLanguages;
  size?: 'sm' | 'lg';
  isTimeseries?: boolean;
  timeRangeCtx: TimeRangeContextProps;
};

function MapPopupContentComponent({
  geoVisitor,
  locale,
  className,
  size = 'sm',
  isTimeseries,
  timeRangeCtx,
}: MapPopupContentProps) {
  const t = useTranslations('components');
  if (!geoVisitor) return null;

  const hasCmp = !!geoVisitor.compare?.compareVisitors;

  const Row = ({
    color,
    label,
    value,
    dim,
  }: {
    color?: string;
    label: React.ReactNode;
    value: React.ReactNode;
    dim?: boolean;
  }) => (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center gap-2'>
        {color && <div className={`${color} h-2 w-2 rounded-full`} />}
        <span className={dim ? 'text-muted-foreground' : ''}>{label}</span>
      </div>
      <span className={cn('font-medium', dim && 'text-muted-foreground')}>{value}</span>
    </div>
  );

  const accCompare = hasCmp ? (
    <div className='flex flex-col space-y-2'>
      <Row
        color='bg-primary'
        label={
          timeRangeCtx.offset !== 0 && timeRangeCtx.interval !== 'custom'
            ? t(`timeRange.presets.${timeRangeCtx.interval}`)
            : formatPrimaryRangeLabel({
                interval: timeRangeCtx.interval,
                offset: timeRangeCtx.offset,
                startDate: timeRangeCtx.startDate,
                endDate: timeRangeCtx.endDate,
              })
        }
        value={formatNumber(geoVisitor.visitors)}
      />
      {timeRangeCtx.compareStartDate && (
        <Row
          color='bg-chart-comparison'
          label={t('timeRange.previousPeriod')}
          value={formatNumber(geoVisitor.compare?.compareVisitors ?? 0)}
          dim
        />
      )}
    </div>
  ) : null;

  const timeseriesCompare = hasCmp ? (
    <div className='flex flex-col space-y-2'>
      <Row
        color='bg-primary'
        label={
          <DateTimeSliderLabel value={geoVisitor.date!} granularity={timeRangeCtx.granularity} animate={false} />
        }
        value={formatNumber(geoVisitor.visitors)}
      />
      <Row
        color='bg-chart-comparison'
        label={
          <DateTimeSliderLabel
            value={geoVisitor.compare!.compareDate!}
            granularity={timeRangeCtx.granularity}
            animate={false}
            className='text-muted-foreground'
          />
        }
        value={formatNumber(geoVisitor.compare?.compareVisitors ?? 0)}
        dim
      />
    </div>
  ) : null;

  return (
    <div
      className={cn(
        'border-border bg-popover/95 text-foreground flex min-w-[200px] flex-col space-y-1 rounded-lg border p-3 text-sm shadow-xl backdrop-blur-sm',
        size === 'sm' ? 'max-w-[300px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <CountryDisplay
        className='justify-center text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <div className='border-border my-2 border-t' />
      <div className='flex items-center gap-1'>
        <span className='text-muted-foreground'>{t('geography.visitors')}</span>
        {hasCmp ? (
          <TrendPercentage percentage={geoVisitor.compare!.dProcent} withParenthesis withIcon />
        ) : (
          <span className='text-foreground ml-1'>{formatNumber(geoVisitor.visitors)}</span>
        )}
      </div>
      {isTimeseries ? timeseriesCompare : accCompare}
    </div>
  );
}

const MapPopupContent = React.memo(MapPopupContentComponent);
MapPopupContent.displayName = 'MapPopupContent';
export default MapPopupContent;
