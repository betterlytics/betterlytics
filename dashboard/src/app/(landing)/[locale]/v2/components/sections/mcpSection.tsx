import { AgentTranscript } from '@/landing/components/illustrations/agentTranscript';
import { Panel, Section, SectionHead } from '@/landing/components/ui/frame';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { SpotlightList } from '@/landing/components/ui/spotlightList';
import { COPY } from '@/landing/content/copy';
import { MCP_CLIENTS } from '@/landing/content/mcpClients';
import { IDS } from '@/landing/lib/ids';
import { LINKS } from '@/landing/lib/links';

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
