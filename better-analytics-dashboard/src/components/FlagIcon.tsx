'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

type FlagIconProps = {
  countryCode: keyof typeof Flags;
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

export function FlagIcon({ countryCode, ...props }: FlagIconProps) {
  const FlagComponent = Flags[countryCode];
  return (
    <FlagComponent {...props} />
  );
}
