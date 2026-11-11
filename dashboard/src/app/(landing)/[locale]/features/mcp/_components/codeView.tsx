'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import styles from './codeView.module.css';

/* Capture groups: comment (own line only, so a URL's "//" isn't one), string (with a trailing colon when it's a
   key), number, literal. */
const JSON_TOKEN = /(^[ \t]*\/\/.*$)|("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/gm;

function marked(text: string, mark?: string): ReactNode {
  const at = mark ? text.indexOf(mark) : -1;
  if (!mark || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className={styles.mark}>{mark}</mark>
      {text.slice(at + mark.length)}
    </>
  );
}

function highlightJson(code: string, mark?: string) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(JSON_TOKEN)) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const [whole, comment, string, colon, number, literal] = match;
    const kind = comment
      ? styles.comment
      : string
        ? colon
          ? styles.key
          : styles.string
        : number
          ? styles.number
          : literal
            ? styles.literal
            : undefined;
    out.push(
      <span key={match.index} className={kind}>
        {string && colon ? string : marked(whole, mark)}
      </span>,
    );
    if (string && colon) out.push(colon);
    last = match.index + whole.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Code that overflows takes keyboard focus so it can be scrolled without a mouse; `label` names it for screen readers. */
export function CodeView({
  code,
  mark,
  label,
  className,
}: {
  code: string;
  mark?: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLPreElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <pre
      ref={ref}
      className={cn(styles.code, className)}
      {...(scrolls && { tabIndex: 0, role: 'region', 'aria-label': label })}
    >
      {highlightJson(code, mark)}
    </pre>
  );
}
