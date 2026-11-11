import type { ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import styles from './codeView.module.css';

/* Capture groups: comment (own line only, so a URL's "//" isn't one), string (with a trailing colon when it's a
   key), number, literal. */
const JSON_TOKEN = /(^[ \t]*\/\/.*$)|("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/gm;

function highlightJson(code: string) {
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
        {string && colon ? string : whole}
      </span>,
    );
    if (string && colon) out.push(colon);
    last = match.index + whole.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeView({ code, className }: { code: string; className?: string }) {
  return <pre className={cn(styles.code, className)}>{highlightJson(code)}</pre>;
}
