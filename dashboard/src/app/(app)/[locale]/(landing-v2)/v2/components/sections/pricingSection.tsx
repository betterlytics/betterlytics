import { Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';
import { PricingPanel } from './pricingPanel';

export function PricingSection() {
  return (
    <Section id={IDS.pricing}>
      <SectionHead title={COPY.pricing.title} lede={COPY.pricing.lede} />
      <PricingPanel />
    </Section>
  );
}
