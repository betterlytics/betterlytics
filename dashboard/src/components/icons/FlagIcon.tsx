import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { getCountryName } from '@/utils/countryCodes';

export type FlagIconProps = {
  countryCode: keyof typeof Flags;
  countryName?: string; // Defaults to result of getCountryName
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

function FlagIconComponent({
  countryCode,
  countryName = getCountryName(countryCode),
  ...props
}: FlagIconProps) {
  const FlagComponent = Flags[countryCode];

  return (
    <span 
      title={countryName} 
      style={{ 
        display: 'inline-block', 
      }}
    >
      <FlagComponent 
        {...props} 
        style={{ 
          border: 'var(--popover-foreground) solid 0.1px',
          height: 'fit-content',
          width: '1em',
        }
      }/>
    </span>
  );
}

export const FlagIcon = React.memo(FlagIconComponent);
