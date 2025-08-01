import { cn } from '@/lib/utils';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import React from 'react';
import { GeoVisitor } from '@/entities/geography';

export type TooltipContentProps = {
  geoVisitor?: GeoVisitor;
  size: 'sm' | 'lg';
};

const TooltipContentComponent = ({ geoVisitor, size }: TooltipContentProps) => {
  if (!geoVisitor) return null;
  return (
    <div
      className={cn(
        'border-border bg-card text-foreground space-y-1 rounded border p-2 text-start shadow-md',
        size === 'sm' ? 'max-w-[200px]' : 'max-w-[40vw]',
      )}
    >
      <CountryDisplay
        className='text-sm font-bold'
        countryCode={geoVisitor.country_code as FlagIconProps['countryCode']}
        countryName={getCountryName(geoVisitor.country_code)}
      />
      <div className='flex gap-1 text-sm whitespace-nowrap'>
        <span className='text-muted-foreground'>Visitors:</span>
        <span className='text-foreground'>{geoVisitor.visitors}</span>
      </div>
    </div>
  );
};

const TooltipContent = React.memo(TooltipContentComponent);
TooltipContent.displayName = 'MapTooltipContent';

export default TooltipContent;
