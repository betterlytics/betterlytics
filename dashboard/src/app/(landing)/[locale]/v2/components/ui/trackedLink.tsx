'use client';

import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { track, type CtaDestination, type CtaPlacement } from '@/landing/lib/analytics';

type Cta = { placement: CtaPlacement; destination: CtaDestination; plan?: string };

/** A call-to-action link within the app that reports where it was and where it led (`landing-cta`). */
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

/**
 * The same for a page outside the app, such as the docs: a plain anchor, since those
 * pages share the origin but not the router and must load as a full navigation.
 */
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
