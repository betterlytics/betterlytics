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
    <span title={countryName || 'Unknown'} className='relative flex items-center justify-center'>
      <FlagComponent
        {...props}
        className='shadow-foreground/80 dark:shadow-background/50 inline-block !h-[1.15em] rounded-xs shadow-sm dark:rounded-none'
        style={{
          imageRendering: 'auto',
          shapeRendering: 'geometricPrecision',
          height: '1.15em',
          width: 'auto',
          display: 'inline-block',
        }}
      />
      <div className='absolute h-full w-full rounded-xs border border-x-gray-900/40 border-y-gray-900/30 bg-gradient-to-b from-white/20 to-white/5 bg-origin-padding dark:rounded-none'></div>
    </span>
  );
}

export const FlagIcon = React.memo(FlagIconComponent);
