'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { useFormatter } from 'next-intl';
import { BLACK_FRIDAY_2026, PROMO_TIME_ZONE, promoHasEnded, promoLastDay, type Promo } from '@/lib/billing/promo';

// Decided on the server; a cached page hydrates with the offer it was rendered with, then drops it once the sale ends
const RenderedLive = createContext(false);

export function PromoProvider({ live, children }: { live: boolean; children: ReactNode }) {
  return <RenderedLive.Provider value={live}>{children}</RenderedLive.Provider>;
}

const subscribe = () => () => {};

export function usePromo(): Promo | null {
  const rendered = useContext(RenderedLive);
  const live = useSyncExternalStore(
    subscribe,
    () => rendered && !promoHasEnded(BLACK_FRIDAY_2026),
    () => rendered,
  );
  return live ? BLACK_FRIDAY_2026 : null;
}

/** Plan changes don't go through checkout, so only a first subscription gets the promo. */
export function useCheckoutPromo(isExistingPaidSubscriber: boolean): Promo | null {
  const promo = usePromo();
  return isExistingPaidSubscriber ? null : promo;
}

export function usePromoLastDay(promo: Promo | null): string {
  const format = useFormatter();
  if (!promo) return '';
  return format.dateTime(promoLastDay(promo), { month: 'short', day: 'numeric', timeZone: PROMO_TIME_ZONE });
}
