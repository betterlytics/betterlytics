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
import { BlindSpot } from './_components/blindSpot';
import { LoadMap } from './_components/field/loadMap';
import { PriorityChart } from './_components/priorityChart';
import { SetupLine } from './_components/setupLine';

const FAQ_KEYS = [
  'what',
  'ranking',
  'free',
  'lab',
  'campaigns',
  'browsers',
  'speed',
  'spa',
  'attribution',
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
            {
              value: 1,
              unit: t('specs.traffic.unit'),
              label: t('specs.traffic.label'),
              body: t('specs.traffic.body'),
            },
            {
              value: 2.6,
              decimals: 1,
              unit: t('specs.weight.unit'),
              label: t('specs.weight.label'),
              body: t('specs.weight.body'),
            },
          ]}
          lit={{
            value: 0,
            unit: t('specs.thesis.unit'),
            label: t('specs.thesis.label'),
            body: t('specs.thesis.body'),
          }}
        />
      </Section>
      <Section id='blind-spot' title={t('blindSpot.title')} lede={t('blindSpot.lede')}>
        <Panel flush framed>
          <BlindSpot />
        </Panel>
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
      <Section id='priority' title={t('priority.title')} lede={t('priority.lede')}>
        <Panel flush framed>
          <PriorityChart />
        </Panel>
      </Section>
      <Section id='setup' title={t('setup.title')} lede={t('setup.lede')}>
        <Panel flush framed>
          <SetupLine />
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
          { key: 'analytics', icon: <MousePointerClick className='size-4' />, href: LINKS.docs, docs: true },
          { key: 'errors', icon: <Bug className='size-4' />, href: '/features/error-tracking' },
          { key: 'replay', icon: <PlayCircle className='size-4' />, href: '/features/session-replay' },
          { key: 'uptime', icon: <Activity className='size-4' />, href: '/features/uptime-monitoring' },
        ]}
      />
    </PageShell>
  );
}
