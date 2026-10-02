import { Section } from '@/landing/components/ui/frame';
import { COPY } from '@/landing/content/copy';
import { IDS } from '@/landing/lib/ids';
import { PricingPanel } from './pricingPanel';

export function PricingSection() {
  return (
    // phone hatch band, mirrored below the card in ctaSection
    <Section
      id={IDS.pricing}
      title={COPY.pricing.title}
      lede={COPY.pricing.lede}
      className='max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:bottom-0 max-sm:after:h-12 max-sm:after:bg-hatch'
    >
      <PricingPanel />
    </Section>
  );
}
