'use client';

import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoVisitorWithCompare } from '@/entities/geography';
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
  t: ReturnType<typeof useTranslations<'components'>>;
  timeRangeCtx: TimeRangeContextProps;
  onMouseEnter?: () => void;
};

function MapPopupContentComponent({
  geoVisitor,
  locale,
  className,
  size = 'sm',
  t,
  timeRangeCtx,
  onMouseEnter,
}: MapPopupContentProps) {
  if (!geoVisitor) return null;

  const percentageChange = geoVisitor.compareVisitors !== undefined
    ? ((geoVisitor.visitors - geoVisitor.compareVisitors) / (geoVisitor.compareVisitors || 1)) * 100
    : undefined;

  const Row = ({
    color,
    label,
    value,
    muted,
    tooltip,
  }: {
    color?: string;
    label: React.ReactNode;
    value: React.ReactNode;
    tooltip?: string;
    muted?: boolean;
  }) => (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center gap-2' title={tooltip}>
        {color && <div className={cn(color, 'h-2 w-2 rounded-full')} />}
        <span className={cn({ 'text-muted-foreground': muted })}>{label}</span>
      </div>
      <span className={cn('font-medium', { 'text-muted-foreground': muted })}>{value}</span>
    </div>
  );

  return (
    <div
      onMouseEnter={onMouseEnter}
      className={cn(
        'border-border bg-popover/95 text-foreground pointer-events-auto flex min-w-[100px] flex-col space-y-1 border p-3 text-sm shadow-xl backdrop-blur-sm',
        size === 'sm' ? 'max-w-[300px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <CountryDisplay
        className={cn('text-sm font-bold', geoVisitor.compareVisitors !== undefined ? 'justify-center' : 'justify-start')}
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      {geoVisitor.compareVisitors !== undefined && <div className='border-border my-2 border-t' />}

      <div className='flex items-center gap-1'>
        <span className='text-muted-foreground'>{t('geography.visitors')}</span>
        {geoVisitor.compareVisitors !== undefined && percentageChange !== undefined ? (
          <TrendPercentage percentage={percentageChange} withParenthesis withIcon />
        ) : (
          <span className='text-foreground ml-1'>{formatNumber(geoVisitor.visitors)}</span>
        )}
      </div>

      {geoVisitor.compareVisitors !== undefined && (
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
            tooltip={`${timeRangeCtx.startDate.toLocaleString()} - ${timeRangeCtx.endDate.toLocaleString()}`}
            value={formatNumber(geoVisitor.visitors)}
          />
          {timeRangeCtx.compareStartDate && (
            <Row
              color='bg-chart-comparison'
              label={t('timeRange.previousPeriod')}
              tooltip={`${timeRangeCtx.compareStartDate.toLocaleString()} - ${timeRangeCtx.compareEndDate?.toLocaleString()}`}
              value={formatNumber(geoVisitor.compareVisitors ?? 0)}
              muted
            />
          )}
        </div>
      )}
    </div>
  );
}

const MapPopupContent = React.memo(MapPopupContentComponent);
MapPopupContent.displayName = 'MapPopupContent';
export default MapPopupContent;
