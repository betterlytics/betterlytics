import { AgentTranscript } from '@/app/(app)/[locale]/(landing-v2)/v2/components/illustrations/agentTranscript';
import { Panel, Section, SectionHead } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { PathIcon } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/pathIcon';
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
            <p>{copy.body}</p>
            <span className='mono mcp__lab'>{copy.worksWith}</span>
            {/* tiles rather than a checked list: the row reads as a compatibility wall, not a to-do list */}
            <ul className='mcp__works'>
              {MCP_CLIENTS.map((client) => (
                <li key={client.name}>
                  <span>
                    <PathIcon icon={client.icon} className='mcpi' />
                  </span>
                  {client.name}
                </li>
              ))}
            </ul>
            <p className='mcp__any'>{copy.any}</p>
            <div className='mcp__cta'>
              <a className='btn btn--line btn--sm' href={LINKS.mcpDocs}>
                {copy.cta}
                <svg width='13' height='13' viewBox='0 0 14 14' fill='none' aria-hidden>
                  <path
                    d='M3 7h8M7.5 3.5 11 7l-3.5 3.5'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </a>
            </div>
          </div>
          <AgentTranscript />
        </div>
      </Panel>
    </Section>
  );
}
