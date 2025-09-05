import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { HelpCircle } from 'lucide-react';

export type FlagIconProps = {
  countryCode: keyof typeof Flags;
  countryName: string;
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

function FlagIconComponent({ countryCode, countryName, ...props }: FlagIconProps) {
  const FlagComponent = Flags[countryCode];

  if (!FlagComponent) {
    return (
      <span title={countryName || 'Unknown'} className='flex items-center justify-center'>
        <HelpCircle
          size='1em'
          style={{
            color: 'var(--foreground)',
            height: '1em',
            width: 'fit-content',
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
          border: 'var(--flagicon-border) solid 0.5px',
          height: '1em',
          aspectRatio: '3/2',
        }}
      />
    </span>
  );
}

export const FlagIcon = React.memo(FlagIconComponent);
