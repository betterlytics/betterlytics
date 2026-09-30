import type { ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import { Emphasis } from './emphasis';
import styles from './frame.module.css';
import { InkFrame } from './inkFrame';
import { Underline } from './reveal';
import { Heading, Lede } from './text';

/* The page's layout primitives. Sections sit between the wall columns; their
   headings live in open canvas and their content in a bounded panel whose rules
   land on the wall lines. */

type SectionProps = {
  id: string;
  /** The section's display line, centred above its content. `*word*` inks an underline under that word. */
  title?: string;
  lede?: string;
  className?: string;
  children: ReactNode;
};

export function Section({ id, title, lede, className, children }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn('relative px-(--inset) pt-[34px] pb-[78px] max-lg:pb-12', className)}
    >
      <div className='relative z-1'>
        {title ? (
          <div className='mb-20 flex flex-col items-center gap-4 text-center max-lg:mb-12'>
            <Heading as='h2' size='display-2' id={titleId}>
              <Emphasis text={title} as={Underline} />
            </Heading>
            {lede ? <Lede className='max-w-[62ch] text-muted'>{lede}</Lede> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** The four corner squares of the positioned parent; `persistent` keeps them on phones too. */
export function Corners({ persistent = false, className }: { persistent?: boolean; className?: string }) {
  return (
    <i
      className={cn(styles.corners, className)}
      data-corners=''
      data-persistent={persistent || undefined}
      aria-hidden
    >
      <i />
    </i>
  );
}

/** A bounded box whose rules land on the wall lines, drawn in as the reader arrives. */
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
    <InkFrame className={cn(styles.panel, !flush && 'px-[30px] max-sm:px-0', className)}>
      <Corners />
      {children}
    </InkFrame>
  );
}
