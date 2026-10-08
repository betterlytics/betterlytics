import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { Corners } from '@/landing/components/ui/frame';
import frame from '@/landing/components/ui/frame.module.css';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { cn } from '@/landing/lib/cn';
import form from './authForm.module.css';
import styles from './authPanel.module.css';

/** Underlined so it isn't told from its sentence by colour alone (as in the landing footer). */
export const FINE_LINK =
  'underline decoration-rule-30 underline-offset-[3px] transition-colors duration-180 ease-out-expo hover:text-fg hover:decoration-current';

/**
 * The inked panel every auth step sits in: corner squares, rules between its head, body and hatched foot, and its
 * edges carried out across the page as construction lines.
 */
export function AuthPanel({
  title,
  lede,
  foot,
  children,
}: {
  title: ReactNode;
  lede: ReactNode;
  foot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <InkFrame className={cn(frame.panel, styles.panel)}>
      <Corners persistent />
      <i className={cn(styles.guide, styles.guideX, styles.atTop)} aria-hidden />
      <i className={cn(styles.guide, styles.guideX, styles.atBottom)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atStart)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atEnd)} aria-hidden />

      <div className={styles.head}>
        <h1 className='text-[1.875rem] leading-[2.125rem] font-medium tracking-[-0.05rem]'>{title}</h1>
        <p className='mt-2.5 text-body-sm text-balance text-muted'>{lede}</p>
      </div>

      <div className={styles.body}>{children}</div>

      {foot ? <div className={cn(styles.foot, 'bg-hatch')}>{foot}</div> : null}
    </InkFrame>
  );
}

/** The foot's line: a lead-in and the page to go to instead. */
export function AuthPrompt({ lead, href, label }: { lead?: string; href: string; label: string }) {
  return (
    <p className='text-center text-label text-muted'>
      {lead ? `${lead} ` : null}
      <Link className={cn('font-medium text-fg', FINE_LINK)} href={href}>
        {label}
      </Link>
    </p>
  );
}

/** A panel body with nothing to fill in: what happened, and the one way on. */
export function AuthAction({ note, href, label }: { note?: ReactNode; href: string; label: string }) {
  return (
    <div className={form.root}>
      {note ? <p className={form.note}>{note}</p> : null}
      <Link className={form.primary} href={href}>
        {label}
      </Link>
    </div>
  );
}
