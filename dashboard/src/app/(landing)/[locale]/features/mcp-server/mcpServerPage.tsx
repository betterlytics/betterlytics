import { Activity, Bug, MousePointerClick, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MCPIcon } from '@/components/icons';
import { FaqSection } from '@/landing/components/feature/faqSection';
import { RelatedSection } from '@/landing/components/feature/relatedSection';
import { SpecStrip } from '@/landing/components/feature/specStrip';
import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { HeroSection } from '@/landing/components/sections/heroSection';
import { Panel, Section } from '@/landing/components/ui/frame';
import { LINKS } from '@/landing/lib/links';
import { AgentWindow } from './_components/agentWindow';
import { ConnectSetup } from './_components/connectSetup';
import { ToolMap } from './_components/toolMap';
import { TrustRow } from './_components/trustRow';

const FAQ_KEYS = [
  'what',
  'free',
  'clients',
  'writes',
  'scope',
  'provider',
  'sites',
  'revoke',
  'schema',
  'selfhost',
] as const;

export function McpServerPage() {
  const t = useTranslations('landing.mcpServer');
  return (
    <PageShell
      hero={
        <HeroSection
          copy={{
            title: t('hero.title'),
            lede: t('hero.lede'),
            primary: t('hero.primary'),
            secondary: { label: t('hero.secondary'), href: LINKS.mcpDocs },
          }}
          breadcrumb={{ icon: <MCPIcon className='size-3' />, label: t('hero.eyebrow') }}
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
            secondaryHref: LINKS.mcpDocs,
          }}
        />
      }
    >
      <Section id='ask' className='z-2 flow-root px-[calc(var(--inset)+8px)] pt-0 pb-2 max-lg:pb-2 max-sm:px-0'>
        <AgentWindow />
      </Section>
      <Section id='specs' className='pt-0 max-sm:pt-8'>
        <SpecStrip
          specs={[
            {
              value: 13,
              unit: t('specs.tools.unit'),
              label: t('specs.tools.label'),
              body: t('specs.tools.body'),
            },
            {
              value: 4,
              unit: t('specs.products.unit'),
              label: t('specs.products.label'),
              body: t('specs.products.body'),
            },
            {
              value: 7,
              unit: t('specs.clients.unit'),
              label: t('specs.clients.label'),
              body: t('specs.clients.body'),
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
      <Section id='tools' title={t('tools.title')} lede={t('tools.lede')}>
        <Panel flush framed>
          <ToolMap />
        </Panel>
      </Section>
      <Section id='setup' title={t('setup.title')} lede={t('setup.lede')}>
        <Panel flush framed>
          <ConnectSetup />
          <TrustRow />
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
          { key: 'uptime', icon: <Activity className='size-4' />, href: '/features/uptime-monitoring' },
          { key: 'replay', icon: <PlayCircle className='size-4' />, href: '/features/session-replay' },
        ]}
      />
    </PageShell>
  );
}
