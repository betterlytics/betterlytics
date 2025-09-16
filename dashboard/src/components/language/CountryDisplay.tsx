import React from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { cn } from '@/lib/utils';

type CountryDisplayProps = {
  countryCode: FlagIconProps['countryCode'];
  countryName: string;
  className?: string;
};

export const CountryDisplay = ({ countryCode, countryName, className }: CountryDisplayProps) => {
  return (
    <div className={cn(className, 'm-0 flex items-center gap-2 overflow-hidden p-0')}>
      <FlagIcon countryCode={countryCode} countryName={countryName} />
      <span className='max-w-full truncate'>{countryName}</span>
    </div>
  );
};
