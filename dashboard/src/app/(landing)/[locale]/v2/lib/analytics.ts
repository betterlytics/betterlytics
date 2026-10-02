import { baEvent } from '@/lib/ba-event';

/** Where on the page a call to action sits. */
export type CtaPlacement = 'nav' | 'menu' | 'hero' | 'mcp' | 'pricing' | 'cta';

/** What a call to action leads to. */
export type CtaDestination = 'signup' | 'contact' | 'docs' | 'mcp-docs';

/** The landing page's custom events, in one place so their names and properties stay consistent. */
export const track = {
  /** A call to action was taken; `plan` when it belongs to a pricing plan. */
  cta: (placement: CtaPlacement, destination: CtaDestination, plan?: string) =>
    baEvent('landing-cta', plan ? { placement, destination, plan } : { placement, destination }),
  /** The reader opened the live demo dashboard. */
  demoOpened: () => baEvent('landing-demo-opened'),
  /** The reader settled the pricing slider on an event volume. */
  pricingVolume: (events: number) => baEvent('landing-pricing-volume', { events }),
};
