'use client';

import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoVisitorWithCompare } from '@/contexts/DeckGLSelectionContextProvider';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { cn } from '@/lib/utils';
import { getCountryName } from '@/utils/countryCodes';
import { formatNumber } from '@/utils/formatters';
import React from 'react';
import { DateTimeSliderLabel } from '@/components/map/deckgl/controls/DateTimeSliderLabel';

export type MapPopupContentProps = {
  geoVisitor?: GeoVisitorWithCompare;
  className?: string;
  label: string;
  locale: SupportedLanguages;
  size: 'sm' | 'lg';
};

function MapPopupContentComponent({ geoVisitor, size, className, label, locale }: MapPopupContentProps) {
  const { granularity } = useTimeRangeContext();

  if (!geoVisitor) return null;

  const hasComparison = Boolean(
    geoVisitor.compare?.compareVisitors &&
      geoVisitor.compare?.compareDate &&
      geoVisitor.compare.dProcent &&
      geoVisitor.date,
  );

  return (
    <div
      className={cn(
        'border-border bg-popover/95 min-w-[200px] rounded-lg border p-3 shadow-xl backdrop-blur-sm',
        'text-foreground flex flex-col space-y-1 text-sm',
        size === 'sm' ? 'max-w-[300px]' : 'max-w-[40vw]',
        className,
      )}
    >
      {/* Country Name */}
      <CountryDisplay
        className='justify-center text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <div className='border-border my-2 border-t'></div>

      <div className='flex items-center justify-start gap-1'>
        <div className='text-muted-foreground flex items-center gap-0.5'>
          <span>{label}</span>
          {!hasComparison && ':'}
        </div>
        {!hasComparison && <span className='text-foreground'>{formatNumber(geoVisitor.visitors ?? 0)}</span>}
        {hasComparison && (
          <div className='flex items-center gap-0'>
            <TrendPercentage percentage={geoVisitor.compare.dProcent} withParenthesis withIcon />
          </div>
        )}
      </div>
      {hasComparison && (
        <>
          <div className='flex flex-col space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <div className='bg-primary h-2 w-2 rounded-full' />
                <DateTimeSliderLabel value={geoVisitor.date!} granularity={granularity} animate={false} />
              </div>
              <div className='font-medium'>{formatNumber(geoVisitor.visitors)}</div>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <div className='bg-chart-comparison h-2 w-2 rounded-full' />
                <DateTimeSliderLabel
                  value={geoVisitor.compare.compareDate!}
                  granularity={granularity}
                  animate={false}
                  className='text-muted-foreground'
                />
              </div>
              <div className='text-muted-foreground'>{formatNumber(geoVisitor.compare?.compareVisitors!)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const MapPopupContent = React.memo(MapPopupContentComponent);
MapPopupContent.displayName = 'MapPopupContent';

export default MapPopupContent;
