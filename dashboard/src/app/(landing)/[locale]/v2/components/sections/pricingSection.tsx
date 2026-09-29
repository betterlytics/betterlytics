import { Section, SectionHead } from '@/landing/components/ui/frame';
import { COPY } from '@/landing/content/copy';
import { IDS } from '@/landing/lib/ids';
import { PricingPanel } from './pricingPanel';

export function PricingSection() {
  return (
    <Section id={IDS.pricing}>
      <SectionHead title={COPY.pricing.title} lede={COPY.pricing.lede} />
      <PricingPanel />
    </Section>
  );
}
