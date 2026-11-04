import { useTranslations } from 'next-intl';
import { FaqSection, type FaqItem } from '@/landing/components/feature/faqSection';
import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { PricingPanel } from '@/landing/components/sections/pricingPanel';
import { Panel, Section } from '@/landing/components/ui/frame';
import { IDS } from '@/landing/lib/ids';
import { PlanComparison } from './_components/planComparison';

export function PricingPage({ faq }: { faq: FaqItem[] }) {
  const t = useTranslations('landing.pricing');
  const tPage = useTranslations('landing.pricingPage');
  return (
    <PageShell
      hero={
        <Section id={IDS.pricing} title={t('title')} titleAs='h1' lede={t('lede')} className='pt-24 max-lg:pt-16'>
          <PricingPanel />
          <p className='mx-auto mt-8 max-w-[62ch] text-center text-label text-pretty text-muted'>
            {tPage('note')}
          </p>
        </Section>
      }
      after={<CtaSection />}
    >
      <Section id='compare' title={tPage('compareTitle')}>
        <Panel flush framed>
          <PlanComparison />
        </Panel>
      </Section>
      <FaqSection id='faq' title={tPage('faqTitle')} items={faq} />
    </PageShell>
  );
}
