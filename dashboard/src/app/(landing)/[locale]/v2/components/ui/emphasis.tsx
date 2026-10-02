import { Fragment, type ElementType, type ReactNode } from 'react';

type EmphasisProps = {
  /** Copy whose emphasised spans are marked with `*asterisks*`, and whose phone line breaks, if any, with `\n`. */
  text: string;
  /** What each marked span renders as: an element such as `em`, or a component that takes children. */
  as: ElementType<{ className?: string; children: ReactNode }>;
  className?: string;
};

/**
 * Renders copy with its `*marked*` spans emphasised, so the content files stay free of
 * JSX. A `\n` is where a headline breaks on phones, for a break that reads better than
 * the one balancing would pick; wider, it is a space.
 */
export function Emphasis({ text, as: Mark, className }: EmphasisProps) {
  return (
    <>
      {text.split('*').map((part, i) => (
        <Fragment key={i}>
          {i % 2 === 1 ? <Mark className={className}>{part}</Mark> : withPhoneBreaks(part)}
        </Fragment>
      ))}
    </>
  );
}

/** A plain stretch of copy, each `\n` in it a line break on phones and a space wider. */
function withPhoneBreaks(part: string) {
  return part.split('\n').map((piece, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <>
          <br className='sm:hidden' />{' '}
        </>
      )}
      {piece}
    </Fragment>
  ));
}
