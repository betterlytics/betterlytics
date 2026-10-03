import { useTranslations } from 'next-intl';
import { Section } from '@/landing/components/ui/frame';
import { IDS } from '@/landing/lib/ids';
import { PricingPanel } from './pricingPanel';

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  return (
    // phone hatch band, mirrored below the card in ctaSection
    <Section
      id={IDS.pricing}
      title={t('title')}
      lede={t('lede')}
      className='max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:bottom-0 max-sm:after:h-12 max-sm:after:bg-hatch'
    >
      <PricingPanel />
    </Section>
  );
}
