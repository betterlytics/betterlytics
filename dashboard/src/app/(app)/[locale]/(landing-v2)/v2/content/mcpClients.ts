import { MCP_CLIENT_ICONS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/icons';
import { LINKS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/links';

/**
 * Clients shown on the compatibility wall. Any MCP client works; these are the
 * ones with a recognisable mark. Each tile deep-links to its own setup on the
 * docs page, which selects the client from the URL hash.
 */
const DOCS_ANCHOR: Record<string, string> = {
  Claude: 'claude-desktop',
  'Claude Code': 'claude-code',
  Cursor: 'cursor',
  'VS Code': 'vs-code',
  Windsurf: 'windsurf',
  Codex: 'codex',
};

export const MCP_CLIENTS = MCP_CLIENT_ICONS.map((client) => ({
  ...client,
  href: `${LINKS.mcpDocs}#${DOCS_ANCHOR[client.name]}`,
}));
