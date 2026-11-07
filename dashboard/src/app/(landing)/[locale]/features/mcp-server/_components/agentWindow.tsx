'use client';

import { useId, useState, type ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { AppWindow, WINDOW_BAR } from '@/landing/components/ui/appWindow';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { cn } from '@/landing/lib/cn';
import { MCP_CLIENT_ICONS } from '@/landing/lib/icons';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import styles from './agentWindow.module.css';
import { ChatScene } from './chatScene';
import { CodexScene } from './codexScene';
import { CursorScene } from './cursorScene';

type SceneKey = 'chat' | 'cursor' | 'codex';

const SCENES: { key: SceneKey; client: string; title: string; Scene: ComponentType }[] = [
  { key: 'chat', client: 'Claude', title: 'Claude', Scene: ChatScene },
  { key: 'cursor', client: 'Cursor', title: 'Cursor', Scene: CursorScene },
  { key: 'codex', client: 'Codex', title: 'Codex', Scene: CodexScene },
];

const iconOf = (client: string) => MCP_CLIENT_ICONS.find((entry) => entry.name === client)!.icon;

export function AgentWindow() {
  const t = useTranslations('landing.mcpServer.window');
  const [index, setIndex] = useState(0);
  const [switched, setSwitched] = useState(false);
  const panelId = useId();

  const select = (next: number) => {
    setIndex(next);
    setSwitched(true);
  };

  return (
    <AppWindow
      className='max-sm:mt-8 max-sm:rounded-none max-sm:border-x-0'
      bar={
        <>
          <span className={cn(WINDOW_BAR, 'font-sans text-[12px] max-md:hidden')} aria-hidden>
            {SCENES[index].title}
          </span>
          <div
            role='tablist'
            aria-label={t('label')}
            className={styles.switcher}
            onKeyDown={rovingTabKeys(index, SCENES.length, select)}
          >
            {SCENES.map(({ key, client }, i) => {
              const name = `${client}: ${t(`${key}.tab`)}`;
              return (
                <button
                  key={key}
                  type='button'
                  role='tab'
                  id={`${panelId}-tab-${i}`}
                  aria-selected={i === index}
                  aria-controls={panelId}
                  aria-label={name}
                  title={name}
                  tabIndex={i === index ? 0 : -1}
                  className={styles.client}
                  onClick={() => select(i)}
                >
                  <PathIcon icon={iconOf(client)} className={styles.clientIcon} />
                  <span className={styles.clientName}>{client}</span>
                </button>
              );
            })}
          </div>
        </>
      }
    >
      <div
        role='tabpanel'
        id={panelId}
        aria-labelledby={`${panelId}-tab-${index}`}
        className={styles.stage}
        data-nosnippet
      >
        {SCENES.map(({ key, Scene }, i) => (
          <div
            key={key}
            className={styles.scene}
            data-active={i === index || undefined}
            data-switched={switched || undefined}
            aria-hidden={i !== index || undefined}
            inert={i !== index}
          >
            <Scene />
          </div>
        ))}
      </div>
    </AppWindow>
  );
}
