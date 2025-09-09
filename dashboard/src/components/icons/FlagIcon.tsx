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
          size='1rem'
          style={{
            color: 'var(--foreground)',
            height: '1rem',
            width: 'auto',
          }}
        />
      </span>
    );
  }

  return (
    <span title={countryName || 'Unknown'} className='flex items-center justify-center'>
      <FlagComponent
        {...props}
        className='shadow-foreground/80 dark:shadow-background/50 !h-[1.15em] w-fit rounded-xs shadow-sm dark:rounded-none'
        style={{
          imageRendering: 'auto',
          shapeRendering: 'geometricPrecision',
        }}
      />
    </span>
  );
}

export const FlagIcon = React.memo(FlagIconComponent);
