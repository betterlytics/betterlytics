import { baEvent } from '@/lib/ba-event';

export type CtaPlacement = 'nav' | 'menu' | 'hero' | 'demo' | 'mcp' | 'pricing' | 'cta';

export type CtaDestination = 'signup' | 'contact' | 'docs' | 'mcp-docs' | 'demo';

export const track = {
  cta: (placement: CtaPlacement, destination: CtaDestination, plan?: string) =>
    baEvent('landing-cta', plan ? { placement, destination, plan } : { placement, destination }),
  demoOpened: () => baEvent('landing-demo-opened'),
  pricingVolume: (events: number) => baEvent('landing-pricing-volume', { events }),
};
