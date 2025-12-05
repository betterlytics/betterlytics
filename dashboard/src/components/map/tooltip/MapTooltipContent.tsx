import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoVisitorWithCompare } from '@/entities/analytics/geography';
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
  onMouseEnter?: () => void;
};

function MapTooltipContent({ geoVisitor, size, className, label, locale, onMouseEnter }: MapTooltipContentProps) {
  if (!geoVisitor) return null;

  const percentageChange =
    geoVisitor.compareVisitors !== undefined
      ? geoVisitor.compareVisitors === 0 && geoVisitor.visitors > 0
        ? undefined
        : ((geoVisitor.visitors - geoVisitor.compareVisitors) / (geoVisitor.compareVisitors || 1)) * 100
      : undefined;

  return (
    <div
      onMouseEnter={onMouseEnter}
      className={cn(
        'text-foreground justify-center space-y-1 p-2 text-start',
        size === 'sm' ? 'max-w-[250px]' : 'max-w-[40vw]',
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
            {geoVisitor.compareVisitors !== undefined && percentageChange !== undefined && (
              <TrendPercentage percentage={percentageChange} withParenthesis={true} withIcon={true} />
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
