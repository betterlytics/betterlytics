import React from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';

type CountryDisplayProps = {
  countryCode: FlagIconProps['countryCode'];
  countryName?: string;  // Defaults to result of getCountryName
  className?: string;
};

export const CountryDisplay = ({ 
  countryCode, 
  countryName = getCountryName(countryCode),
  className,
}: CountryDisplayProps) => {
  return (
    <div className={cn(className, 'm-0 flex items-center gap-2 p-0 overflow-hidden')}>
      <FlagIcon
        countryCode={countryCode} 
        countryName={countryName}
        className='flex-shrink-0 aspect-[3/2] w-auto!' 
      />
      <span className='truncate max-w-full'>{countryName}</span>
    </div>
  )
}