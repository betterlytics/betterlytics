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
import { ControlsGrid } from './_components/controlsGrid';
import { MaskingShowcase } from './_components/maskingShowcase';
import { ReplayStory } from './_components/replayStory';
import { SetupPanel } from './_components/setupPanel';

const FAQ_KEYS = [
  'what',
  'free',
  'consent',
  'masked',
  'slow',
  'sample',
  'find',
  'history',
  'mobile',
  'dedicated',
] as const;

export function ReplayPage() {
  const t = useTranslations('landing.replay');
  return (
    <PageShell
      hero={
        <HeroSection
          copy={{
            title: t('hero.title'),
            lede: t('hero.lede'),
            primary: t('hero.primary'),
            secondary: { label: t('hero.secondary'), href: LINKS.replayDocs },
          }}
          breadcrumb={{ icon: <PlayCircle className='size-3' strokeWidth={2.5} />, label: t('hero.eyebrow') }}
          titleClassName='max-w-[980px] max-2xl:max-w-[700px]'
        />
      }
      after={
        <CtaSection
          copy={{
            title: t('cta.title'),
            lede: t('cta.lede'),
            primary: t('cta.primary'),
            secondary: t('cta.secondary'),
            secondaryHref: LINKS.replayDocs,
          }}
        />
      }
    >
      <DemoSection href='/demo/replay' src='/demo/replay' className='pb-2 max-lg:pb-2' />
      <Section id='specs' className='pt-0 max-sm:pt-8'>
        <SpecStrip
          specs={[
            { value: 8, unit: t('specs.speed.unit'), label: t('specs.speed.label'), body: t('specs.speed.body') },
            {
              value: 60,
              unit: t('specs.history.unit'),
              label: t('specs.history.label'),
              body: t('specs.history.body'),
            },
            { value: 15, unit: t('specs.short.unit'), label: t('specs.short.label'), body: t('specs.short.body') },
          ]}
          lit={{
            value: 100,
            unit: t('specs.thesis.unit'),
            label: t('specs.thesis.label'),
            body: t('specs.thesis.body'),
          }}
        />
      </Section>
      <Section id='story' title={t('story.title')} lede={t('story.lede')}>
        <Panel flush framed>
          <ReplayStory />
        </Panel>
      </Section>
      <Section id='privacy' title={t('privacy.title')} lede={t('privacy.lede')}>
        <Panel flush framed>
          <MaskingShowcase />
        </Panel>
      </Section>
      <Section id='controls' title={t('controls.title')} lede={t('controls.lede')}>
        <Panel flush>
          <ControlsGrid />
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
          { key: 'errors', icon: <Bug className='size-4' />, href: `${LINKS.docs}/dashboard/errors` },
          { key: 'vitals', icon: <Gauge className='size-4' />, href: `${LINKS.docs}/dashboard/web-vitals` },
          { key: 'uptime', icon: <Activity className='size-4' />, href: '/features/uptime-monitoring' },
        ]}
      />
    </PageShell>
  );
}
