'use client';

import Image from 'next/image';
import { Fragment, useState } from 'react';
import { cn } from '@/lib/utils';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';
import { SNIPPETS } from '@/app/(app)/[locale]/(landing-v2)/v2/content/snippets';

/* The page's palette, not an editor theme: strings take the accent, tag names
   full ink, and attribute names, keywords and template variables recede, so the
   URL and the site id are what the eye lands on. */
const TOKEN =
  /("[^"]*"|'[^']*')|(<\/?[a-zA-Z][\w:.-]*|\/?>)|(\b(?:import|export|default|from|function|return|async|true)\b)|(%[\w.]+%)|([\w:@-]+(?==)|\b[\w-]+(?=:\s))/g;

function Highlight({ code }: { code: string }) {
  const out = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    if (m.index > last) out.push(<Fragment key={last}>{code.slice(last, m.index)}</Fragment>);
    const cls = m[1] ? 'str' : m[2] ? 'tag' : m[3] ? 'kw' : m[4] ? 'var' : 'attr';
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

/**
 * The install snippet in a code frame with one file tab per framework. The
 * frame matches the MCP transcript's chrome, so the two read as one family.
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
            ) : null}
            {s.tab}
          </button>
        ))}
      </div>
      <pre className='cf__code'>
        <code>
          <Highlight code={current.code} />
        </code>
      </pre>
      {/* what the tag fetches, as a network row: the numbers beside it, seen from the browser's side */}
      <div className='cf__foot' aria-hidden>
        <span>GET</span>
        <b>/analytics.js</b>
        <span className='ok'>200</span>
        <span>
          {COPY.network.stats[0].value} {COPY.network.stats[0].unit} gzipped
        </span>
        <span>after paint</span>
      </div>
    </div>
  );
}
