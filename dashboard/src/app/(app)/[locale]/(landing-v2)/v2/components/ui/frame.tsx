import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Emphasis } from './emphasis';
import { Underline } from './reveal';

/* The page's layout primitives. Sections sit between the wall columns; their
   headings live in open canvas and their content in a bounded panel whose
   rules land on the wall lines. */

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('sec', className)} id={id}>
      <div className='sec__in'>{children}</div>
    </section>
  );
}

/** Centred display line plus lede. `*word*` in the title draws the underline. */
export function SectionHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className='head'>
      <h2 className='d2'>
        <Emphasis text={title} wrap={(span) => <Underline>{span}</Underline>} />
      </h2>
      {lede ? <p className='lede'>{lede}</p> : null}
    </div>
  );
}

/** One element paints all four corner squares of its positioned parent. */
export function Corners() {
  return (
    <i className='cnr' aria-hidden>
      <i />
    </i>
  );
}

export function Panel({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={cn('panel', flush && 'panel--flush', className)}>
      <Corners />
      {children}
    </div>
  );
}
