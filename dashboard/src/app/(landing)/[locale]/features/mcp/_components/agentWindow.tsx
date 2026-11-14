'use client';

import { useId, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { AppWindow, WINDOW_BAR } from '@/landing/components/ui/appWindow';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { useInView } from '@/landing/hooks/useInView';
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

/** From the stage's top to the first line of a conversation. */
const THREAD_TOP = 80;

export function AgentWindow() {
  const t = useTranslations('landing.mcpServer.window');
  const [index, setIndex] = useState(0);
  const [switched, setSwitched] = useState(false);
  const [run, setRun] = useState(0);
  const [held, setHeld] = useState(false);
  const panelId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, 'enter');

  // The replay starts on load; hold it back only when the conversation loaded below the fold, where nobody saw it
  useLayoutEffect(() => {
    const top = stage.current?.getBoundingClientRect().top;
    if (top !== undefined && top + THREAD_TOP > window.innerHeight) setHeld(true);
  }, []);

  const select = (next: number) => {
    setIndex(next);
    setSwitched(true);
    setRun((count) => count + 1);
  };

  return (
    <AppWindow
      // on phones the title bar's dots (the window's first child) make room for the note
      className='max-sm:mt-8 max-sm:[&>:first-child]:hidden'
      bar={
        <>
          <p className={styles.note} data-nosnippet>
            <span>
              <span aria-hidden>* </span>
              {t('note')}
            </span>
          </p>
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
        ref={stage}
        role='tabpanel'
        id={panelId}
        aria-labelledby={`${panelId}-tab-${index}`}
        className={styles.stage}
        data-replay={held && !inView && !switched ? 'armed' : undefined}
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
            {/* a new key remounts the scene, which replays it */}
            <Scene key={i === index ? run : -1} />
          </div>
        ))}
      </div>
    </AppWindow>
  );
}
