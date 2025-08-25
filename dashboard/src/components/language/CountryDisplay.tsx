import React from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

type CountryDisplayProps = {
  countryCode: FlagIconProps['countryCode'];
  countryName?: string; // Defaults to result of getCountryName w. current locale
  className?: string;
};

export const CountryDisplay = ({ countryCode, countryName, className }: CountryDisplayProps) => {
  if (!countryName) {
    const locale = useLocale();
    console.log('locale is', locale);
    countryName = getCountryName(countryCode, locale);
  }
  return (
    <div className={cn(className, 'm-0 flex items-center gap-2 overflow-hidden p-0')}>
      <FlagIcon countryCode={countryCode} countryName={countryName} className='flex-shrink-0' />
      <span className='max-w-full truncate'>{countryName}</span>
    </div>
  );
};
