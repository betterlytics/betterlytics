import { Activity, Bug, Gauge, MousePointerClick, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FaqSection } from '@/landing/components/feature/faqSection';
import { RelatedSection } from '@/landing/components/feature/relatedSection';
import { SpecStrip } from '@/landing/components/feature/specStrip';
import type { ScriptKey } from '@/landing/components/illustrations/agentTranscript';
import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { DemoSection } from '@/landing/components/sections/demoSection';
import { HeroSection } from '@/landing/components/sections/heroSection';
import { McpPanel } from '@/landing/components/sections/mcpSection';
import { Panel, Section } from '@/landing/components/ui/frame';
import { LINKS } from '@/landing/lib/links';
import { ReportSplit } from './_components/reportSplit';
import { SessionTrail } from './_components/sessionTrail';
import { SetupConfigurator } from './_components/setupConfigurator';
import { TriageBento } from './_components/triageBento';

const FAQ_KEYS = [
  'what',
  'free',
  'captured',
  'server',
  'filtered',
  'frameworks',
  'grouped',
  'sourcemaps',
  'privacy',
  'quota',
  'replay',
] as const;

const MCP_SCRIPTS: ScriptKey[] = ['debug', 'triage'];

const TRIAGE_TITLE = 'triage-title';

export function ErrorsPage() {
  const t = useTranslations('landing.errors');
  const tTranscript = useTranslations('landing.illustrations.transcript');
  return (
    <PageShell
      hero={
        <HeroSection
          copy={{
            title: t('hero.title'),
            lede: t('hero.lede'),
            primary: t('hero.primary'),
            secondary: { label: t('hero.secondary'), href: LINKS.errorsDocs },
          }}
          breadcrumb={{ icon: <Bug className='size-3' strokeWidth={2.5} />, label: t('hero.eyebrow') }}
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
            secondaryHref: LINKS.errorsDocs,
          }}
        />
      }
    >
      <DemoSection href='/demo/errors' src='/demo/errors' className='pb-2 max-lg:pb-2' />
      <Section id='specs' className='pt-0 max-sm:pt-8'>
        <SpecStrip
          specs={[
            {
              value: 2,
              unit: t('specs.leadUp.unit'),
              label: t('specs.leadUp.label'),
              body: t('specs.leadUp.body'),
            },
            {
              value: 0,
              unit: t('specs.extensions.unit'),
              label: t('specs.extensions.label'),
              body: t('specs.extensions.body'),
            },
            {
              value: 1,
              unit: t('specs.script.unit'),
              label: t('specs.script.label'),
              body: t('specs.script.body'),
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
      <Section id='reports' title={t('report.title')} lede={t('report.lede')}>
        <Panel flush framed>
          <ReportSplit />
        </Panel>
      </Section>
      <Section id='trail' title={t('trail.title')} lede={t('trail.lede')}>
        <Panel flush framed>
          <SessionTrail />
        </Panel>
      </Section>
      <Section id='triage' labelledBy={TRIAGE_TITLE}>
        <Panel flush framed>
          <TriageBento titleId={TRIAGE_TITLE} />
        </Panel>
      </Section>
      <Section id='mcp' title={t('agent.title')} lede={t('agent.lede')}>
        <Panel flush framed>
          <McpPanel
            lead={t('agent.lead')}
            body={t('agent.body')}
            cta={t('agent.cta')}
            scripts={MCP_SCRIPTS}
            alt={tTranscript('debugAlt')}
          />
        </Panel>
      </Section>
      <Section id='setup' title={t('setup.title')} lede={t('setup.lede')}>
        <Panel flush framed>
          <SetupConfigurator />
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
          { key: 'replay', icon: <PlayCircle className='size-4' />, href: '/features/session-replay' },
          {
            key: 'vitals',
            icon: <Gauge className='size-4' />,
            href: `${LINKS.docs}/dashboard/web-vitals`,
            docs: true,
          },
          { key: 'uptime', icon: <Activity className='size-4' />, href: '/features/uptime-monitoring' },
        ]}
      />
    </PageShell>
  );
}
