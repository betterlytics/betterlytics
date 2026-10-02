'use client';

import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { track, type CtaDestination, type CtaPlacement } from '@/landing/lib/analytics';

type Cta = { placement: CtaPlacement; destination: CtaDestination; plan?: string };

export function TrackedLink({
  placement,
  destination,
  plan,
  onClick,
  ...props
}: ComponentProps<typeof Link> & Cta) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        track.cta(placement, destination, plan);
        onClick?.(event);
      }}
    />
  );
}

/** For pages outside the Next router (e.g. docs), which need a full navigation. */
export function TrackedAnchor({ placement, destination, plan, onClick, ...props }: ComponentProps<'a'> & Cta) {
  return (
    <a
      {...props}
      onClick={(event) => {
        track.cta(placement, destination, plan);
        onClick?.(event);
      }}
    />
  );
}
