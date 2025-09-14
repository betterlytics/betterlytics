import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { SupportedLanguages } from '@/constants/i18n';
import { GeoVisitor } from '@/entities/geography';
import { cn } from '@/lib/utils';
import { getCountryName } from '@/utils/countryCodes';
import { formatNumber } from '@/utils/formatters';
import React from 'react';

export type MapTooltipContentProps = {
  geoVisitor?: GeoVisitor;
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
        size === 'sm' ? 'max-w-[200px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <CountryDisplay
        className='text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code, locale)}
      />
      <div className='flex gap-1 text-sm whitespace-nowrap'>
        <span className='text-muted-foreground'>{label}:</span>
        <span className='text-foreground'>{formatNumber(geoVisitor.visitors)}</span>
      </div>
    </div>
  );
}

const MemoizedMapTooltipContent = React.memo(MapTooltipContent);
MemoizedMapTooltipContent.displayName = 'MapTooltipContent';

export default MemoizedMapTooltipContent;
