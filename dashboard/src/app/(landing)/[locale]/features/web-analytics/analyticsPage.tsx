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
import { AppLink } from '@/landing/components/ui/appLink';
import { Panel, Section } from '@/landing/components/ui/frame';
import { FINE_LINK } from '@/landing/components/ui/text';
import { LINKS } from '@/landing/lib/links';
import { ConsentSplit } from './_components/consentSplit';
import { DipTrace } from './_components/dipTrace';
import { FirstVisit } from './_components/firstVisit';
import { FunnelRibbon } from './_components/funnelRibbon';
import { SourceRoutes } from './_components/sourceRoutes';
import { ToolkitGrid } from './_components/toolkitGrid';

const FAQ_KEYS = [
  'what',
  'free',
  'cookies',
  'unique',
  'gdpr',
  'ai',
  'events',
  'spa',
  'bots',
  'retention',
  'ga',
] as const;

const FAQ_LINKS: Partial<Record<(typeof FAQ_KEYS)[number], string>> = {
  free: '/pricing',
  gdpr: '/dpa',
  ga: '/vs/google-analytics',
};

const MCP_SCRIPTS: ScriptKey[] = ['sources', 'redesign'];

export function AnalyticsPage() {
  const t = useTranslations('landing.analytics');
  const tTranscript = useTranslations('landing.illustrations.transcript');
  return (
    <PageShell
      hero={
        <HeroSection
          copy={{
            title: t('hero.title'),
            lede: t('hero.lede'),
            primary: t('hero.primary'),
            secondary: { label: t('hero.secondary'), href: LINKS.docs },
          }}
          breadcrumb={{
            icon: <MousePointerClick className='size-3' strokeWidth={2.5} />,
            label: t('hero.eyebrow'),
          }}
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
            secondaryHref: LINKS.docs,
          }}
        />
      }
    >
      <DemoSection className='pb-2 max-lg:pb-2' />
      <Section id='specs' className='pt-0 max-sm:pt-8'>
        <SpecStrip
          specs={[
            {
              value: 3.7,
              decimals: 1,
              unit: t('specs.script.unit'),
              label: t('specs.script.label'),
              body: t('specs.script.body'),
            },
            {
              value: 10,
              unit: t('specs.ai.unit'),
              label: t('specs.ai.label'),
              body: t('specs.ai.body'),
            },
            {
              value: 10,
              unit: t('specs.live.unit'),
              label: t('specs.live.label'),
              body: t('specs.live.body'),
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
      <Section id='sources' title={t('sources.title')} lede={t('sources.lede')}>
        <Panel flush framed>
          <SourceRoutes />
        </Panel>
      </Section>
      <Section id='funnels' title={t('funnel.title')} lede={t('funnel.lede')}>
        <Panel flush framed>
          <FunnelRibbon />
        </Panel>
      </Section>
      <Section id='why' title={t('trace.title')} lede={t('trace.lede')}>
        <Panel flush framed>
          <DipTrace />
        </Panel>
      </Section>
      <Section id='privacy' title={t('privacy.title')} lede={t('privacy.lede')}>
        <Panel flush framed>
          <ConsentSplit />
        </Panel>
      </Section>
      <Section id='toolkit' title={t('toolkit.title')} lede={t('toolkit.lede')}>
        <Panel flush>
          <ToolkitGrid />
        </Panel>
      </Section>
      <Section id='mcp' title={t('agent.title')} lede={t('agent.lede')}>
        <Panel flush framed>
          <McpPanel
            lead={t('agent.lead')}
            body={t('agent.body')}
            cta={t('agent.cta')}
            scripts={MCP_SCRIPTS}
            alt={tTranscript('analyticsAlt')}
          />
        </Panel>
      </Section>
      <Section id='setup' title={t('setup.title')} lede={t('setup.lede')}>
        <Panel flush framed>
          <FirstVisit />
        </Panel>
      </Section>
      <FaqSection
        id='faq'
        title={t('faq.title')}
        items={FAQ_KEYS.map((key) => {
          const href = FAQ_LINKS[key];
          return {
            q: t(`faq.items.${key}.q`),
            a: t.markup(`faq.items.${key}.a`, { link: (chunks) => chunks }),
            rich: href
              ? t.rich(`faq.items.${key}.a`, {
                  link: (chunks) => (
                    <AppLink className={FINE_LINK} href={href}>
                      {chunks}
                    </AppLink>
                  ),
                })
              : undefined,
          };
        })}
      />
      <RelatedSection
        lede={t('related.lede')}
        items={[
          { key: 'replay', icon: <PlayCircle className='size-4' />, href: '/features/session-replay' },
          { key: 'errors', icon: <Bug className='size-4' />, href: '/features/error-tracking' },
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
