import { Fragment, type ElementType, type ReactNode } from 'react';

type EmphasisProps = {
  /** Copy whose emphasised spans are marked with `*asterisks*`. */
  text: string;
  /** What each marked span renders as: an element such as `em`, or a component that takes children. */
  as: ElementType<{ className?: string; children: ReactNode }>;
  className?: string;
};

/** Renders copy with its `*marked*` spans emphasised, so the content files stay free of JSX. */
export function Emphasis({ text, as: Mark, className }: EmphasisProps) {
  return (
    <>
      {text.split('*').map((part, i) => (
        <Fragment key={i}>{i % 2 === 1 ? <Mark className={className}>{part}</Mark> : part}</Fragment>
      ))}
    </>
  );
}
