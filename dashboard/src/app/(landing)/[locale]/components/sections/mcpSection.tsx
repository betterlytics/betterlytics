import { useTranslations } from 'next-intl';
import { AgentTranscript, type ScriptKey } from '@/landing/components/illustrations/agentTranscript';
import { buttonStyles } from '@/landing/components/ui/button';
import { Panel, Section } from '@/landing/components/ui/frame';
import { LinkTiles } from '@/landing/components/ui/linkTiles';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { Heading, Label } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { MCP_CLIENTS } from '@/landing/content/mcpClients';
import { IDS } from '@/landing/lib/ids';
import { LINKS } from '@/landing/lib/links';

const WORKS_WITH_ID = 'mcp-works-with';

const CLIENT_TILES = MCP_CLIENTS.map((client) => ({
  name: client.name,
  href: client.href,
  icon: <PathIcon icon={client.icon} className='size-3.5' />,
}));

type McpPanelProps = { lead: string; body: string; cta: string; scripts?: ScriptKey[]; alt?: string };

export function McpPanel({ lead, body, cta, scripts, alt }: McpPanelProps) {
  const t = useTranslations('landing.mcp');
  return (
    <div className='grid grid-cols-[1fr_1.15fr] grid-rows-[1fr_auto] max-lg:grid-cols-1 max-lg:grid-rows-none'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 pt-8 transition-ink max-lg:border-r-0 max-lg:border-b max-lg:pb-8 max-sm:px-6'>
        <Heading as='h3' size='title' className='mb-2'>
          {lead}
        </Heading>
        <p className='mb-6 text-body leading-[23px] text-muted'>{body}</p>
        <Label id={WORKS_WITH_ID} className='mb-4 block'>
          {t('worksWith')}
        </Label>
        <LinkTiles items={CLIENT_TILES} labelledBy={WORKS_WITH_ID} />
        <p className='mt-7 text-caption leading-[19px] text-muted'>{t('any')}</p>
      </div>
      <AgentTranscript
        only={scripts}
        alt={alt}
        className='row-span-2 m-4.5 max-lg:row-span-1 max-lg:mt-0 max-sm:m-0 max-sm:rounded-none max-sm:border-0'
      />
      <div className='border-r border-rule-10 px-7.5 pt-6.5 pb-8 transition-ink max-lg:border-r-0 max-lg:pt-3.5 max-sm:hidden'>
        <TrackedAnchor
          className={buttonStyles({ variant: 'line', size: 'sm' })}
          href={LINKS.mcpDocs}
          placement='mcp'
          destination='mcp-docs'
        >
          {cta}
        </TrackedAnchor>
      </div>
    </div>
  );
}

export function McpSection() {
  const t = useTranslations('landing.mcp');
  return (
    <Section id={IDS.mcp} title={t('title')} lede={t('lede')}>
      <Panel flush framed>
        <McpPanel lead={t('lead')} body={t('body')} cta={t('cta')} />
      </Panel>
    </Section>
  );
}
