'use client';

import Image from 'next/image';
import { useId, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SCRAMBLE_STEP, Scramble } from '@/landing/components/ui/scramble';
import { SNIPPETS } from '@/landing/content/snippets';
import { cn } from '@/landing/lib/cn';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import styles from './snippetPanel.module.css';

/* Capture groups follow TOKEN_KINDS order. Comments are whole lines so a URL's "//" isn't one. */
const TOKEN =
  /(<!--[\s\S]*?-->|^\s*(?:\/\/|#).*$)|("[^"]*"|'[^']*')|(<\/?[a-zA-Z][\w:.-]*|\/?>)|(\b(?:import|export|default|from|function|return|async|true)\b)|(%[\w.]+%)|([\w:@-]+(?==)|\b[\w-]+(?=:\s))/gm;
const TOKEN_KINDS = [styles.comment, styles.string, styles.tag, styles.keyword, styles.variable, styles.attribute];

function Highlight({ code }: { code: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const kind = TOKEN_KINDS[match.slice(1).findIndex((group) => group !== undefined)];
    out.push(
      <span key={match.index} className={kind}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return <>{out}</>;
}

function Lines({ code }: { code: string }) {
  return (
    <>
      {code.split('\n').map((raw, i) => {
        const added = raw.startsWith('+');
        const line = added ? raw.slice(1) : raw;
        return (
          <span key={i} className={styles.line} data-added={added || undefined}>
            <Highlight code={line || ' '} />
          </span>
        );
      })}
    </>
  );
}

type FootPart = { text: string; ink?: boolean };

/** The package injects the same script tag, so every tab makes this request. */
const REQUEST: readonly FootPart[] = [
  { text: 'GET' },
  { text: '/analytics.js', ink: true },
  { text: '200', ink: true },
  { text: 'async' },
];
/** the 14px gap between parts, in 11px mono characters */
const GAP_CHARS = 2;

function FootParts({ parts }: { parts: readonly FootPart[] }) {
  let at = 0;
  return (
    <>
      {parts.map((part, i) => {
        const delay = at * SCRAMBLE_STEP;
        at += part.text.length + GAP_CHARS;
        return <Scramble key={i} className={part.ink ? 'text-fg' : undefined} text={part.text} delay={delay} />;
      })}
    </>
  );
}

/** Not npm's mark, since pnpm, yarn and bun work too. */
function BoxIcon() {
  return (
    <svg
      className='opacity-80'
      viewBox='0 0 16 16'
      width='13'
      height='13'
      aria-hidden
      fill='none'
      stroke='currentColor'
      strokeWidth='1.3'
    >
      <path d='M8 1.8 14 5v6L8 14.2 2 11V5z' strokeLinejoin='round' />
      <path d='M2 5l6 3 6-3M8 8v6.2' strokeLinejoin='round' />
    </svg>
  );
}

/** Frame chrome matches AgentTranscript's. */
export function SnippetPanel() {
  const t = useTranslations('landing.network');
  const id = useId();
  const [active, setActive] = useState(0);
  const current = SNIPPETS[active];
  const tabId = (index: number) => `${id}-tab-${index}`;
  const panelId = (index: number) => `${id}-panel-${index}`;

  return (
    <div className='flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-fg/9 bg-terminal'>
      {/* overflow-y-hidden: the tabs' -mb-px would otherwise make it scroll vertically */}
      <div
        className={cn(
          styles.tabs,
          'flex [scrollbar-width:none] gap-0.5 overflow-x-auto overflow-y-hidden border-b border-fg/7 bg-fg/3 px-2.5 pt-2',
        )}
      >
        <div
          role='tablist'
          aria-label={t('snippetLabel')}
          className='flex gap-0.5'
          onKeyDown={rovingTabKeys(active, SNIPPETS.length, setActive)}
        >
          {SNIPPETS.map((snippet, i) => (
            <button
              key={snippet.id}
              type='button'
              role='tab'
              id={tabId(i)}
              aria-controls={panelId(i)}
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              className={cn(
                'group -mb-px inline-flex items-center gap-[7px] rounded-t-md border-b-2 border-transparent px-3 pt-2 pb-2.5',
                'font-mono text-[11.5px] whitespace-nowrap text-muted hover:text-fg',
                'transition-[color,background-color,border-color] duration-200 ease-out-expo',
                'aria-selected:border-volt-soft aria-selected:bg-fg/6 aria-selected:text-fg',
              )}
              onClick={() => setActive(i)}
            >
              {snippet.logo ? (
                <Image
                  className='size-[13px] opacity-80 group-aria-selected:opacity-100'
                  src={`/framework-logos/${snippet.logo}-icon.svg`}
                  alt=''
                  width={13}
                  height={13}
                />
              ) : (
                <BoxIcon />
              )}
              {snippet.name ?? t('packageTab')}
            </button>
          ))}
        </div>
        {current.file ? (
          <Scramble
            className='ml-auto self-center pr-1.5 pb-0.5 pl-4 font-mono text-micro whitespace-nowrap text-muted opacity-80'
            text={current.file}
          />
        ) : null}
      </div>
      {/* all snippets share one grid cell so the frame keeps the tallest's height across tabs */}
      <pre className='grid min-h-[260px] flex-1 content-start overflow-x-auto px-[22px] pt-5 pb-6 font-mono text-code leading-[1.75] whitespace-pre text-fg/72'>
        {SNIPPETS.map((snippet, i) => (
          <code
            key={snippet.id}
            role='tabpanel'
            id={panelId(i)}
            aria-labelledby={tabId(i)}
            tabIndex={0}
            className={cn('col-start-1 row-start-1', i === active ? 'visible' : 'invisible')}
          >
            <Lines code={snippet.code} />
          </code>
        ))}
      </pre>
      <div
        className='mt-auto flex items-center gap-3.5 overflow-hidden border-t border-fg/7 bg-fg/2 px-4 py-[9px] font-mono text-micro tracking-[0.02em] whitespace-nowrap text-muted'
        aria-hidden
        data-nosnippet
      >
        <FootParts parts={REQUEST} />
      </div>
    </div>
  );
}
