'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonStyles } from '@/landing/components/ui/button';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import { SETUP_CLIENTS as CLIENTS, type SetupClientName } from './clients';
import { CodeView } from './codeView';
import { CopyButton } from './copyButton';
import styles from './connectSetup.module.css';

const SERVER_URL = 'https://betterlytics.io/api/mcp';
const TOKEN = 'btl_your_token_here';
const TOKEN_INPUT = 'btl-token';

/* The docs' install link without a token: VS Code asks for it through the input. */
const VS_CODE_INSTALL = `https://vscode.dev/redirect/mcp/install?${[
  'name=betterlytics',
  `inputs=${encodeURIComponent(
    JSON.stringify([
      { type: 'promptString', id: TOKEN_INPUT, description: 'Betterlytics MCP token', password: true },
    ]),
  )}`,
  `config=${encodeURIComponent(
    JSON.stringify({
      type: 'http',
      url: SERVER_URL,
      headers: { Authorization: `Bearer \${input:${TOKEN_INPUT}}` },
    }),
  )}`,
].join('&')}`;

type ClientId = 'claude' | 'claude-code' | 'cursor' | 'vs-code' | 'windsurf' | 'antigravity' | 'codex';

/* Same snippets as the docs' McpSetup, with the placeholder token; Claude Desktop shows the macOS and Linux one. */
const SETUP: Record<SetupClientName, { id: ClientId; label?: string; file: string; code: string }> = {
  Claude: {
    id: 'claude',
    label: 'Claude Desktop',
    file: 'claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "betterlytics": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "${SERVER_URL}",
        "--header", "Authorization:Bearer ${TOKEN}"
      ]
    }
  }
}`,
  },
  'Claude Code': {
    id: 'claude-code',
    file: 'Terminal',
    code: `claude mcp add --transport http betterlytics ${SERVER_URL} \\
  --header "Authorization: Bearer ${TOKEN}"`,
  },
  Cursor: {
    id: 'cursor',
    file: '.cursor/mcp.json',
    code: `{
  "mcpServers": {
    "betterlytics": {
      "url": "${SERVER_URL}",
      "headers": { "Authorization": "Bearer ${TOKEN}" }
    }
  }
}`,
  },
  'VS Code': {
    id: 'vs-code',
    file: '.vscode/mcp.json',
    code: `{
  "servers": {
    "betterlytics": {
      "type": "http",
      "url": "${SERVER_URL}",
      "headers": { "Authorization": "Bearer ${TOKEN}" }
    }
  }
}`,
  },
  Windsurf: {
    id: 'windsurf',
    file: '~/.codeium/windsurf/mcp_config.json',
    code: `{
  "mcpServers": {
    "betterlytics": {
      "serverUrl": "${SERVER_URL}",
      "headers": { "Authorization": "Bearer ${TOKEN}" }
    }
  }
}`,
  },
  Antigravity: {
    id: 'antigravity',
    file: '~/.gemini/config/mcp_config.json',
    code: `{
  "mcpServers": {
    "betterlytics": {
      "serverUrl": "${SERVER_URL}",
      "headers": { "Authorization": "Bearer ${TOKEN}" }
    }
  }
}`,
  },
  Codex: {
    id: 'codex',
    file: '~/.codex/config.toml',
    code: `[mcp_servers.betterlytics]
url = "${SERVER_URL}"
http_headers = { "Authorization" = "Bearer ${TOKEN}" }`,
  },
};

export function ConnectSetup() {
  const t = useTranslations('landing.mcpServer.setup');
  const [index, setIndex] = useState(() => CLIENTS.findIndex((client) => client.name === 'VS Code'));
  const panelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const client = CLIENTS[index];
  const setup = SETUP[client.name];
  const install = setup.id === 'vs-code' || setup.id === 'cursor' ? setup.id : null;

  useEffect(() => {
    const list = listRef.current;
    const tab = list?.children[index];
    if (!list || !(tab instanceof HTMLElement) || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = tab.offsetLeft - 16;
  }, [index]);

  return (
    <div className={styles.setup}>
      <div
        ref={listRef}
        role='tablist'
        aria-label={t('label')}
        aria-orientation='vertical'
        className={styles.clients}
        onKeyDown={(event) => {
          rovingTabKeys(index, CLIENTS.length, setIndex, 'vertical')(event);
          if (!event.defaultPrevented) rovingTabKeys(index, CLIENTS.length, setIndex)(event);
        }}
      >
        {CLIENTS.map((entry, i) => (
          <button
            key={entry.name}
            type='button'
            role='tab'
            id={`${panelId}-tab-${i}`}
            aria-selected={i === index}
            aria-controls={panelId}
            tabIndex={i === index ? 0 : -1}
            className={styles.client}
            onClick={() => setIndex(i)}
          >
            <PathIcon icon={entry.icon} className={styles.clientIcon} />
            <span className={styles.clientName}>{SETUP[entry.name].label ?? entry.name}</span>
          </button>
        ))}
      </div>

      <div role='tabpanel' id={panelId} aria-labelledby={`${panelId}-tab-${index}`} className={styles.detail}>
        {install && (
          <div className={styles.install}>
            {install === 'vs-code' ? (
              <a className={buttonStyles({ variant: 'volt', size: 'sm' })} href={VS_CODE_INSTALL} rel='noopener'>
                {t('install.vs-code')}
                <ArrowUpRight className='size-3.5' aria-hidden />
              </a>
            ) : (
              <TrackedAnchor
                className={buttonStyles({ variant: 'volt', size: 'sm' })}
                href={client.href}
                placement='setup'
                destination='mcp-docs'
              >
                {t('install.cursor')}
                <ArrowUpRight className='size-3.5' aria-hidden />
              </TrackedAnchor>
            )}
            <p className={styles.installNote}>{t(`installNote.${install}`)}</p>
          </div>
        )}
        <p className={styles.body}>{t(`clients.${setup.id}`)}</p>
        <div className={styles.code}>
          <div className={styles.codeBar}>
            <span className={styles.file}>{setup.file}</span>
            <CopyButton text={setup.code} label={t('copy')} done={t('copied')} className={styles.copy} />
          </div>
          <CodeView code={setup.code} className={styles.snippet} />
        </div>
        <p className={styles.token}>
          <KeyRound className='size-3.5 flex-none' aria-hidden />
          {t('token')}
        </p>
        <TrackedAnchor className={styles.guide} href={client.href} placement='setup' destination='mcp-docs'>
          {t('guide')}
          <ArrowUpRight className='size-3.5' aria-hidden />
        </TrackedAnchor>
      </div>
    </div>
  );
}
