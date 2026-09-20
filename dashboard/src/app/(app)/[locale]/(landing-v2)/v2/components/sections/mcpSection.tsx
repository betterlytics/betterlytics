import { AgentTranscript } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/agentTranscript';
import { Panel, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { PathIcon } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/pathIcon';
import { SpotlightList } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/spotlightList';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { MCP_CLIENTS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/mcpClients';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';
import { LINKS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/links';

const copy = COPY.mcp;

export function McpSection() {
  return (
    <Section id={IDS.mcp}>
      <SectionHead title={copy.title} lede={copy.lede} />
      <Panel flush>
        <div className='mcp__grid'>
          <div className='mcp__side'>
            <h3 className='mcp__lead'>{copy.lead}</h3>
            <p>{copy.body}</p>
            <span className='label mcp__lab'>{copy.worksWith}</span>
            {/* tiles rather than a checked list: the row reads as a compatibility wall, not a to-do list */}
            <SpotlightList className='mcp__works'>
              {MCP_CLIENTS.map((client) => (
                <li key={client.name}>
                  <a href={client.href}>
                    <span>
                      <PathIcon icon={client.icon} className='mcpi' />
                    </span>
                    {client.name}
                  </a>
                </li>
              ))}
            </SpotlightList>
            <p className='mcp__any'>{copy.any}</p>
            <div className='mcp__cta'>
              <a className='btn btn--line btn--sm' href={LINKS.mcpDocs}>
                {copy.cta}
              </a>
            </div>
          </div>
          <AgentTranscript />
        </div>
      </Panel>
    </Section>
  );
}
