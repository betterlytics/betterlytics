import { Fragment, type ElementType, type ReactNode } from 'react';

type EmphasisProps = {
  /** `*word*` marks emphasis; `\n` breaks the line on phones only. */
  text: string;
  as: ElementType<{ className?: string; children: ReactNode }>;
  className?: string;
};

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
