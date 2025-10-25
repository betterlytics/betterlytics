import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { TrendIndicator } from '@/components/TrendIndicator';
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
  return (
    <div
      className={cn(
        'text-foreground justify-center space-y-1 p-2 text-center',
        size === 'sm' ? 'max-w-[300px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <CountryDisplay
        className='justify-center text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <div className='bg-border my-2 h-[1px] w-full'></div>
      <div className='flex flex-col justify-start text-sm whitespace-nowrap'>
        {!geoVisitor.date ? (
          <div className='flex gap-2 text-sm whitespace-nowrap'>
            <span className='text-muted-foreground'>{label}:</span>
            <div className='text-foreground flex flex-row gap-1'>
              <span>{formatNumber(geoVisitor.visitors)}</span>
              {geoVisitor.compare && (
                <div className='flex flex-row'>
                  <TrendIndicator percentage={geoVisitor.compare.dProcent} />
                  {!Number.isNaN(geoVisitor.compare.dProcent) && geoVisitor.compare.dProcent !== 0 && (
                    <TrendPercentage percentage={geoVisitor.compare.dProcent} withParenthesis />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-4 text-sm whitespace-nowrap'>
            <DateTimeSliderLabel value={geoVisitor.date} granularity={granularity}>
              :
            </DateTimeSliderLabel>
            <span>{formatNumber(geoVisitor.visitors)}</span>
          </div>
        )}
        {geoVisitor.compare?.compareDate && geoVisitor.compare?.compareVisitors && (
          <div className='flex items-center gap-4 text-sm whitespace-nowrap'>
            <DateTimeSliderLabel
              value={geoVisitor.compare.compareDate}
              granularity={granularity}
            ></DateTimeSliderLabel>
            <span>{formatNumber(geoVisitor.compare.compareVisitors)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
const MapPopupContent = React.memo(MapPopupContentComponent);
MapPopupContent.displayName = 'MapPopupContent';

export default MapPopupContent;
