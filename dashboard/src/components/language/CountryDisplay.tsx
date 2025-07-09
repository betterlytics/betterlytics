import React from 'react';
import { FlagIcon } from '@/components/icons/FlagIcon';
import { FlagIconProps } from '@/components/icons/FlagIcon';
import { getCountryName } from '@/utils/countryCodes';

type CountryDisplayProps = {
  countryCode: FlagIconProps['countryCode'];
  countryName?: string;  // Defaults to result of getCountryName
};

export const CountryDisplay = ({ 
  countryCode, 
  countryName = getCountryName(countryCode),
}: CountryDisplayProps) => {
  return (
    <div className='m-0 flex items-center gap-2 p-0 overflow-hidden'>
      <FlagIcon
        countryCode={countryCode} 
        countryName={countryName} 
        className='h-4 w-4 flex-shrink-0' 
      />
      <span className='truncate max-w-full'>{countryName}</span>
    </div>
  )
}