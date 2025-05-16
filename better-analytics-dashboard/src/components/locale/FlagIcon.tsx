'use client';

import { cn } from '@/lib/utils';
import React from 'react';
// Import *all* flags as components keyed by their country code
import * as Flags from 'country-flag-icons/react/3x2';

type FlagIconProps = {
  alpha2: string; // ISO 3166-1 alpha-2 code (uppercase preferred)
  height?: number; // Height in px
  className?: string;
  style?: React.CSSProperties;
};

export function FlagIcon({ alpha2, height = 20, className, style, ...props }: FlagIconProps) {
  const aspectRatioWidth = (height * 3) / 2;
  const FlagComponent = Flags[alpha2.toUpperCase() as keyof typeof Flags];

  const spinner = (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ height, width:  (height * 3) / 2 }}
      aria-label="Loading flag"
      role="img"
    >
      <div className="border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!FlagComponent) {
    // Render fallback spinner if no flag found
    return spinner;
  }

  return (
    <div
      style={{
        height,
        width: aspectRatioWidth,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      className={className}
      {...props}
      aria-label={`${alpha2.toUpperCase()} flag`}
      role="img"
    >
      <FlagComponent style={{ height: '100%', width: 'auto' }} />
    </div>
  );
}
