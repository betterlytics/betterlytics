'use client';

import type { ComponentProps } from 'react';
import { AppLink } from '@/landing/components/ui/appLink';
import { track, type CtaDestination, type CtaPlacement } from '@/landing/lib/analytics';

type Cta = { placement: CtaPlacement; destination: CtaDestination; plan?: string };

export function TrackedLink({
  placement,
  destination,
  plan,
  onClick,
  ...props
}: ComponentProps<typeof AppLink> & Cta) {
  return (
    <AppLink
      {...props}
      onClick={(event) => {
        track.cta(placement, destination, plan);
        onClick?.(event);
      }}
    />
  );
}

/** For pages outside the Next router (e.g. docs). */
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
