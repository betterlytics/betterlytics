import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FlagIconProps = {
  countryCode: keyof typeof Flags;
  countryName: string;
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

function FlagIconComponent({ countryCode, countryName, className, ...props }: FlagIconProps) {
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
        className={cn('inline-block h-4 rounded-xs dark:rounded-none', className)}
        style={{
          imageRendering: 'auto',
          shapeRendering: 'geometricPrecision',
          width: 'auto',
          display: 'inline-block',
        }}
      />
      <div className='absolute h-full w-full rounded-xs border border-x-gray-900/30 border-t-gray-900/25 border-b-gray-900/50 bg-linear-to-b from-white/5 via-white/15 via-20% to-black/10 bg-origin-padding dark:rounded-none dark:border-x-white/10 dark:border-t-gray-900/50 dark:border-b-black/15 dark:via-white/10'></div>
    </span>
  );
}

export const FlagIcon = React.memo(FlagIconComponent);
