import { useTranslations } from 'next-intl';
import { AgentTranscript, type ScriptKey } from '@/landing/components/illustrations/agentTranscript';
import { McpClientTiles } from '@/landing/components/sections/mcpSection';
import { buttonStyles } from '@/landing/components/ui/button';
import { Heading, Label } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { LINKS } from '@/landing/lib/links';

const SCRIPTS: ScriptKey[] = ['investigate', 'outage'];

const WORKS_WITH_ID = 'uptime-mcp-works-with';

export function AgentPanel() {
  const t = useTranslations('landing.uptime.agent');
  const tMcp = useTranslations('landing.mcp');
  const tTranscript = useTranslations('landing.illustrations.transcript');
  return (
    <div className='grid grid-cols-[1fr_1.15fr] max-lg:grid-cols-1'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 pt-8 pb-8 transition-ink max-lg:border-r-0 max-lg:border-b max-sm:px-6'>
        <Heading as='h3' size='title' className='mb-2'>
          {t('lead')}
        </Heading>
        <p className='mb-6 text-body leading-[23px] text-muted'>{t('body')}</p>
        <Label id={WORKS_WITH_ID} className='mb-4 block'>
          {tMcp('worksWith')}
        </Label>
        <McpClientTiles labelledBy={WORKS_WITH_ID} />
        <p className='mt-7 text-caption leading-[19px] text-muted'>{tMcp('any')}</p>
        <div className='mt-auto pt-8 max-sm:hidden'>
          <TrackedAnchor
            className={buttonStyles({ variant: 'line', size: 'sm' })}
            href={LINKS.mcpDocs}
            placement='mcp'
            destination='mcp-docs'
          >
            {t('cta')}
          </TrackedAnchor>
        </div>
      </div>
      <AgentTranscript
        only={SCRIPTS}
        alt={tTranscript('uptimeAlt')}
        className='m-4.5 max-lg:mt-0 max-sm:m-0 max-sm:rounded-none max-sm:border-0'
      />
    </div>
  );
}
