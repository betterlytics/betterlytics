import type { ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import { Emphasis } from './emphasis';
import styles from './frame.module.css';
import { InkFrame } from './inkFrame';
import { Underline } from './reveal';
import { Heading, Lede } from './text';

type SectionProps = {
  id: string;
  /** `*word*` underlines that word. */
  title?: string;
  lede?: string;
  balanced?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({ id, title, lede, balanced = true, className, children }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn('relative px-(--inset) pt-[34px] pb-[78px] max-lg:pb-12', title && 'max-sm:pt-12', className)}
    >
      <div className='relative z-1'>
        {title ? (
          <div className='mb-20 flex flex-col items-center gap-4 text-center max-lg:mb-12'>
            <Heading as='h2' size='display-2' id={titleId} className={balanced ? undefined : 'max-sm:text-wrap'}>
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

/** Corner squares of the positioned parent; `persistent` keeps them on phones. */
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

/** Phones have no walls: by default its rules run to the screen edges; `framed` draws its own sides, for cards. */
export function Panel({
  children,
  className,
  flush = false,
  framed = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
  framed?: boolean;
}) {
  return (
    <InkFrame className={cn(styles.panel, framed && styles.framed, !flush && 'px-[30px] max-sm:px-0', className)}>
      <Corners persistent={framed} />
      {children}
    </InkFrame>
  );
}
