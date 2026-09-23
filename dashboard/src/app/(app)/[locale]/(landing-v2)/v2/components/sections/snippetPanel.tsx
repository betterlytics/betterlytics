'use client';

import Image from 'next/image';
import { Fragment, useState } from 'react';
import { cn } from '@/lib/utils';
import { SNIPPETS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/snippets';

/* The page's palette, not an editor theme: strings take the accent, tag names
   full ink, and comments, attribute names, keywords and template variables
   recede, so the URL and the site id are what the eye lands on. Comments are
   whole lines, so a URL's "//" is never mistaken for one. */
const TOKEN =
  /(<!--[\s\S]*?-->|^\s*(?:\/\/|#).*$)|("[^"]*"|'[^']*')|(<\/?[a-zA-Z][\w:.-]*|\/?>)|(\b(?:import|export|default|from|function|return|async|true)\b)|(%[\w.]+%)|([\w:@-]+(?==)|\b[\w-]+(?=:\s))/gm;

function Highlight({ code }: { code: string }) {
  const out = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    if (m.index > last) out.push(<Fragment key={last}>{code.slice(last, m.index)}</Fragment>);
    const cls = m[1] ? 'cm' : m[2] ? 'str' : m[3] ? 'tag' : m[4] ? 'kw' : m[5] ? 'var' : 'attr';
    out.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(<Fragment key={last}>{code.slice(last)}</Fragment>);
  return <>{out}</>;
}

/** One line per row. A leading `+` marks a line the reader adds; it is lit, the rest dim. */
function Lines({ code }: { code: string }) {
  return (
    <>
      {code.split('\n').map((raw, i) => {
        const added = raw.startsWith('+');
        const line = added ? raw.slice(1) : raw;
        return (
          <span key={i} className={cn('ln', added && 'is-add')}>
            <Highlight code={line || ' '} />
          </span>
        );
      })}
    </>
  );
}

/** A neutral box for the package tab: not npm's mark, since pnpm, yarn and bun are all welcome. */
function BoxIcon() {
  return (
    <svg viewBox='0 0 16 16' width='13' height='13' aria-hidden fill='none' stroke='currentColor' strokeWidth='1.3'>
      <path d='M8 1.8 14 5v6L8 14.2 2 11V5z' strokeLinejoin='round' />
      <path d='M2 5l6 3 6-3M8 8v6.2' strokeLinejoin='round' />
    </svg>
  );
}

/**
 * The install snippet in a code frame with one tab per framework. The frame
 * matches the MCP transcript's chrome, so the two read as one family.
 */
export function SnippetPanel() {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const current = SNIPPETS.find((s) => s.id === active) ?? SNIPPETS[0];
  return (
    <div className='cf'>
      <div className='cf__tabs' role='tablist'>
        {SNIPPETS.map((s) => (
          <button
            key={s.id}
            type='button'
            role='tab'
            aria-selected={s.id === active}
            className={cn(s.id === active && 'is-on')}
            onClick={() => setActive(s.id)}
          >
            {s.logo ? (
              <Image src={`/framework-logos/${s.logo}-icon.svg`} alt='' width={13} height={13} unoptimized />
            ) : (
              <BoxIcon />
            )}
            {s.name}
          </button>
        ))}
        {current.file ? <span className='cf__file'>{current.file}</span> : null}
      </div>
      {/* every snippet shares one grid cell, so the frame is always as tall as the
          longest and nothing below it moves when the tab changes */}
      <pre className='cf__code'>
        {SNIPPETS.map((s) => (
          <code key={s.id} className={cn('cf__pane', s.id === active && 'is-on')} aria-hidden={s.id !== active}>
            <Lines code={s.code} />
          </code>
        ))}
      </pre>
      {/* what the tag fetches, as the browser's network panel would list it; the package ships inside the bundle instead */}
      <div className='cf__foot' aria-hidden>
        {current.bundled ? (
          <>
            <span>bundled</span>
            <b>@betterlytics/tracker</b>
            <span>no extra request</span>
          </>
        ) : (
          <>
            <span>GET</span>
            <b>/analytics.js</b>
            <span className='ok'>200</span>
            <span>async</span>
            <span>after paint</span>
          </>
        )}
      </div>
    </div>
  );
}
