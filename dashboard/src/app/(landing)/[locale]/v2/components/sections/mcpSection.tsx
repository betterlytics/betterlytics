import { AgentTranscript } from '@/landing/components/illustrations/agentTranscript';
import { buttonStyles } from '@/landing/components/ui/button';
import { Panel, Section } from '@/landing/components/ui/frame';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { SpotlightList } from '@/landing/components/ui/spotlightList';
import { Heading, Label } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { COPY } from '@/landing/content/copy';
import { MCP_CLIENTS } from '@/landing/content/mcpClients';
import { IDS } from '@/landing/lib/ids';
import { LINKS } from '@/landing/lib/links';
import styles from './mcpSection.module.css';

const copy = COPY.mcp;
const WORKS_WITH_ID = 'mcp-works-with';

export function McpSection() {
  return (
    <Section id={IDS.mcp} title={copy.title} lede={copy.lede}>
      <Panel flush>
        <div className='grid grid-cols-[1fr_1.15fr] max-lg:grid-cols-1'>
          <div className='flex flex-col border-r border-rule-10 px-7.5 py-8 transition-ink max-lg:border-r-0 max-lg:border-b'>
            {/* a small heading over the body, so that beside the bright transcript
                the paragraph does not read as a lede without a headline */}
            <Heading as='h3' size='title' className='mb-2'>
              {copy.lead}
            </Heading>
            <p className='mb-6 text-body leading-[23px] text-muted'>{copy.body}</p>
            <Label id={WORKS_WITH_ID} className='mb-4 block'>
              {copy.worksWith}
            </Label>
            {/* tiles rather than a checked list: the row reads as a compatibility wall, not a to-do list */}
            <SpotlightList
              aria-labelledby={WORKS_WITH_ID}
              className='grid grid-cols-2 gap-[9px] border-t border-rule-08 pt-4.5 transition-ink'
            >
              {MCP_CLIENTS.map((client) => (
                <li key={client.name} className={styles.tile}>
                  {/* the link fills the tile, so the whole tile is the target */}
                  <a
                    className='relative flex items-center gap-[11px] rounded-[inherit] px-3 py-[9px] outline-hidden focus-visible:inset-ring-[1.5px] focus-visible:inset-ring-volt-soft/70'
                    href={client.href}
                  >
                    <span className='grid size-6.5 flex-none place-items-center rounded-md bg-fg/7 opacity-90'>
                      <PathIcon icon={client.icon} className='size-3.5' />
                    </span>
                    {client.name}
                  </a>
                </li>
              ))}
            </SpotlightList>
            <p className='mt-7 text-caption leading-[19px] text-muted'>{copy.any}</p>
            <div className='mt-auto pt-6.5 max-lg:mt-6.5'>
              <TrackedAnchor
                className={buttonStyles({ variant: 'line', size: 'sm' })}
                href={LINKS.mcpDocs}
                placement='mcp'
                destination='mcp-docs'
              >
                {copy.cta}
              </TrackedAnchor>
            </div>
          </div>
          <AgentTranscript className='m-4.5 max-lg:mt-0' />
        </div>
      </Panel>
    </Section>
  );
}
