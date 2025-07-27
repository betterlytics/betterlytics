import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { getCountryName } from '@/utils/countryCodes';
import { HelpCircle } from 'lucide-react';

export type FlagIconProps = {
  countryCode: keyof typeof Flags;
  countryName?: string;
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

function FlagIconComponent({ countryCode, countryName = getCountryName(countryCode), ...props }: FlagIconProps) {
  const FlagComponent = Flags[countryCode];

  if (!FlagComponent) {
    return (
      <span title={countryName || 'Unknown'} className='flex items-center justify-center'>
        <HelpCircle
          size='1em'
          style={{
            color: '#9ca3af',
            height: 'fit-content',
            width: '1em',
          }}
        />
      </span>
    );
  }

  return (
    <span title={countryName || 'Unknown'} className='flex items-center justify-center'>
      <FlagComponent
        {...props}
        style={{
          border: 'var(--popover-foreground) solid 0.1px',
          height: 'fit-content',
          width: '1em',
        }}
      />
    </span>
  );
}

export const FlagIcon = React.memo(FlagIconComponent);
