import { cn } from '@/lib/utils';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import React from 'react';
import { GeoVisitor } from '@/entities/geography';

export type MapTooltipContentProps = {
  geoVisitor?: GeoVisitor;
  className?: string;
  size: 'sm' | 'lg';
};

const MapTooltipContentComponent = ({ geoVisitor, size, className }: MapTooltipContentProps) => {
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
        countryName={getCountryName(geoVisitor.country_code)}
      />
      <div className='flex gap-1 text-sm whitespace-nowrap'>
        <span className='text-muted-foreground'>Visitors:</span>
        <span className='text-foreground'>{geoVisitor.visitors}</span>
      </div>
    </div>
  );
};

const MapTooltipContent = React.memo(MapTooltipContentComponent);
MapTooltipContent.displayName = 'MapTooltipContent';

export default MapTooltipContent;
