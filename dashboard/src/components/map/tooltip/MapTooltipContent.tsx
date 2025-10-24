import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { TrendIndicator } from '@/components/TrendIndicator';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoVisitorWithCompare } from '@/contexts/DeckGLSelectionContextProvider';
import { cn } from '@/lib/utils';
import { getCountryName } from '@/utils/countryCodes';
import { formatNumber } from '@/utils/formatters';
import React from 'react';

export type MapTooltipContentProps = {
  geoVisitor?: GeoVisitorWithCompare;
  className?: string;
  label: string;
  locale: SupportedLanguages;
  size: 'sm' | 'lg';
};

function MapTooltipContent({ geoVisitor, size, className, label, locale }: MapTooltipContentProps) {
  if (!geoVisitor) return null;
  return (
    <div
      className={cn(
        'text-foreground space-y-1 p-2 text-start',
        size === 'sm' ? 'max-w-[300px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <CountryDisplay
        className='text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <div className='flex flex-col justify-start text-sm whitespace-nowrap'>
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
      </div>
    </div>
  );
}
const MemoizedMapTooltipContent = React.memo(MapTooltipContent);
MemoizedMapTooltipContent.displayName = 'MapTooltipContent';

export default MemoizedMapTooltipContent;
