import { Activity, ArrowUpRight, Bug, Gauge, MousePointerClick, PlayCircle } from 'lucide-react';
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
import { AlertsPanel } from './_components/alertsPanel';
import { ChecksGrid } from './_components/checksGrid';
import { IncidentStory } from './_components/incidentStory';
import { StatusShowcase } from './_components/statusShowcase';

const FAQ_KEYS = [
  'what',
  'free',
  'scope',
  'often',
  'false',
  'down',
  'alerts',
  'ssl',
  'domain',
  'internal',
  'dedicated',
] as const;

const MCP_SCRIPTS: ScriptKey[] = ['investigate', 'outage'];

export function UptimePage() {
  const t = useTranslations('landing.uptime');
  const tTranscript = useTranslations('landing.illustrations.transcript');
  const tDemo = useTranslations('landing.demo');
  return (
    <PageShell
      hero={
        <HeroSection
          copy={{
            title: t('hero.title'),
            lede: t('hero.lede'),
            primary: t('hero.primary'),
            secondary: { label: t('hero.secondary'), href: LINKS.monitoringDocs },
          }}
          breadcrumb={{ icon: <Activity className='size-3' strokeWidth={2.5} />, label: t('hero.eyebrow') }}
          titleClassName='max-w-[980px] max-2xl:max-w-[700px]'
          note={
            <a
              href={LINKS.status}
              target='_blank'
              rel='noopener'
              className='-mt-3 inline-flex items-center gap-2 text-label text-on-volt transition-opacity duration-180 ease-out-expo [text-shadow:0_1px_10px_rgb(16_28_150/0.7)] hover:opacity-80 max-sm:mt-0 max-sm:self-center'
            >
              <i className='size-1.5 rounded-full bg-live shadow-[0_0_0_3px_rgb(74_222_155/0.25)]' aria-hidden />
              {t('hero.proof')}
              <ArrowUpRight className='size-3.5' aria-hidden />
              <span className='sr-only'> {tDemo('newTab')}</span>
            </a>
          }
        />
      }
      after={
        <CtaSection
          copy={{
            title: t('cta.title'),
            lede: t('cta.lede'),
            primary: t('cta.primary'),
            secondary: t('cta.secondary'),
            secondaryHref: LINKS.monitoringDocs,
          }}
        />
      }
    >
      <DemoSection href='/demo/monitoring' src='/demo/monitoring' className='pb-2 max-lg:pb-2' />
      <Section id='specs' className='pt-0 max-sm:pt-8'>
        <SpecStrip
          specs={[
            {
              value: 1,
              unit: t('specs.interval.unit'),
              label: t('specs.interval.label'),
              body: t('specs.interval.body'),
            },
            {
              value: 30,
              unit: t('specs.ssl.unit'),
              label: t('specs.ssl.label'),
              body: t('specs.ssl.body'),
            },
            {
              value: 90,
              unit: t('specs.history.unit'),
              label: t('specs.history.label'),
              body: t('specs.history.body'),
            },
          ]}
          lit={{
            value: 5,
            unit: t('specs.thesis.unit'),
            label: t('specs.thesis.label'),
            body: t('specs.thesis.body'),
          }}
        />
      </Section>
      <Section id='incident' title={t('story.title')} lede={t('story.lede')}>
        <Panel flush framed>
          <IncidentStory />
        </Panel>
      </Section>
      <Section id='checks' title={t('checks.title')} lede={t('checks.lede')}>
        <Panel flush>
          <ChecksGrid />
        </Panel>
      </Section>
      <Section id='alerts' title={t('alerts.title')} lede={t('alerts.lede')}>
        <Panel flush framed>
          <AlertsPanel />
        </Panel>
      </Section>
      <Section id='status-pages' title={t('status.title')} lede={t('status.lede')}>
        <Panel flush framed>
          <StatusShowcase />
        </Panel>
      </Section>
      <Section id='mcp' title={t('agent.title')} lede={t('agent.lede')}>
        <Panel flush framed>
          <McpPanel
            lead={t('agent.lead')}
            body={t('agent.body')}
            cta={t('agent.cta')}
            scripts={MCP_SCRIPTS}
            alt={tTranscript('uptimeAlt')}
          />
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
          { key: 'errors', icon: <Bug className='size-4' />, href: '/features/error-tracking' },
          {
            key: 'vitals',
            icon: <Gauge className='size-4' />,
            href: `${LINKS.docs}/dashboard/web-vitals`,
            docs: true,
          },
        ]}
      />
    </PageShell>
  );
}
