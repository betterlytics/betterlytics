import { Fragment, type ReactNode } from 'react';

/**
 * Renders copy that marks its emphasised span with `*asterisks*`, wrapping
 * each marked span with `wrap`. Keeps the content files free of JSX.
 */
export function Emphasis({ text, wrap }: { text: string; wrap: (span: string) => ReactNode }) {
  const parts = text.split('*');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{i % 2 === 1 ? wrap(part) : part}</Fragment>
      ))}
    </>
  );
}
