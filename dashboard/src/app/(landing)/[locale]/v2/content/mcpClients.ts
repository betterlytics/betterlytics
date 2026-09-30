import { MCP_CLIENT_ICONS } from '@/landing/lib/icons';
import { LINKS } from '@/landing/lib/links';

type McpClientName = (typeof MCP_CLIENT_ICONS)[number]['name'];

/**
 * Clients shown on the compatibility wall. Any MCP client works; these are the
 * ones with a recognisable mark. Each tile deep-links to its own setup on the
 * docs page, which selects the client from the URL hash.
 */
const DOCS_ANCHOR = {
  Claude: 'claude-desktop',
  'Claude Code': 'claude-code',
  Cursor: 'cursor',
  'VS Code': 'vs-code',
  Windsurf: 'windsurf',
  Codex: 'codex',
} satisfies Record<McpClientName, string>;

export const MCP_CLIENTS = MCP_CLIENT_ICONS.map((client) => ({
  ...client,
  href: `${LINKS.mcpDocs}#${DOCS_ANCHOR[client.name]}`,
}));
