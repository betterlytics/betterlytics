import { Activity, Bug, Gauge, MousePointerClick, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FaqSection } from '@/landing/components/feature/faqSection';
import { RelatedSection } from '@/landing/components/feature/relatedSection';
import { SpecStrip } from '@/landing/components/feature/specStrip';
import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { DemoSection } from '@/landing/components/sections/demoSection';
import { HeroSection } from '@/landing/components/sections/heroSection';
import { Panel, Section } from '@/landing/components/ui/frame';
import { LINKS } from '@/landing/lib/links';
import { LoadFilmstrip } from './_components/anatomy/filmstrip';
import { BreakdownExplorer } from './_components/breakdownExplorer';
import { LoadMap } from './_components/field/loadMap';
import { PriorityChart } from './_components/priorityChart';
import { ReviewDock } from './_components/review/reviewDock';
import { SetupPanel } from './_components/setupPanel';

const FAQ_KEYS = [
  'what',
  'free',
  'lab',
  'percentile',
  'browsers',
  'speed',
  'spa',
  'attribution',
  'alerts',
  'privacy',
  'dedicated',
] as const;

export function VitalsPage() {
  const t = useTranslations('landing.vitals');
  return (
    <PageShell
      hero={
        <HeroSection
          copy={{
            title: t('hero.title'),
            lede: t('hero.lede'),
            primary: t('hero.primary'),
            secondary: { label: t('hero.secondary'), href: LINKS.vitalsDocs },
          }}
          breadcrumb={{ icon: <Gauge className='size-3' strokeWidth={2.5} />, label: t('hero.eyebrow') }}
          titleClassName='max-w-[1000px] max-2xl:max-w-[720px]'
        />
      }
      after={
        <CtaSection
          copy={{
            title: t('cta.title'),
            lede: t('cta.lede'),
            primary: t('cta.primary'),
            secondary: t('cta.secondary'),
            secondaryHref: LINKS.vitalsDocs,
          }}
        />
      }
    >
      <DemoSection href='/demo/web-vitals' src='/demo/web-vitals' className='pb-2 max-lg:pb-2' />
      <Section id='specs' className='pt-0 max-sm:pt-8'>
        <SpecStrip
          specs={[
            {
              value: 5,
              unit: t('specs.metrics.unit'),
              label: t('specs.metrics.label'),
              body: t('specs.metrics.body'),
            },
            { value: 1, unit: t('specs.event.unit'), label: t('specs.event.label'), body: t('specs.event.body') },
            {
              value: 2.6,
              decimals: 1,
              unit: t('specs.weight.unit'),
              label: t('specs.weight.label'),
              body: t('specs.weight.body'),
            },
          ]}
          lit={{
            value: 3,
            unit: t('specs.thesis.unit'),
            label: t('specs.thesis.label'),
            body: t('specs.thesis.body'),
          }}
        />
      </Section>
      <Section id='field' title={t('field.title')} lede={t('field.lede')}>
        <Panel flush framed>
          <LoadMap />
        </Panel>
      </Section>
      <Section id='metrics' title={t('anatomy.title')} lede={t('anatomy.lede')}>
        <Panel flush framed>
          <LoadFilmstrip />
        </Panel>
      </Section>
      <Section id='breakdown' title={t('breakdown.title')} lede={t('breakdown.lede')}>
        <Panel flush framed>
          <BreakdownExplorer />
        </Panel>
      </Section>
      <Section id='priority' title={t('priority.title')} lede={t('priority.lede')}>
        <Panel flush framed>
          <PriorityChart />
        </Panel>
      </Section>
      <Section id='setup' title={t('setup.title')} lede={t('setup.lede')}>
        <Panel flush framed>
          <SetupPanel />
        </Panel>
      </Section>
      <FaqSection
        id='faq'
        title={t('faq.title')}
        items={FAQ_KEYS.map((key) => ({ q: t(`faq.items.${key}.q`), a: t(`faq.items.${key}.a`) }))}
      />
      <RelatedSection
        lede={t('related.lede')}
        items={[
          { key: 'analytics', icon: <MousePointerClick className='size-4' />, href: LINKS.docs },
          { key: 'errors', icon: <Bug className='size-4' />, href: '/features/error-tracking' },
          { key: 'replay', icon: <PlayCircle className='size-4' />, href: '/features/session-replay' },
          { key: 'uptime', icon: <Activity className='size-4' />, href: '/features/uptime-monitoring' },
        ]}
      />
      <ReviewDock />
    </PageShell>
  );
}
