import type { ReactNode, Ref } from 'react';
import { Link } from '@/i18n/navigation';
import { isUnlocalizedPath } from '@/i18n/routing';
import { Corners } from '@/landing/components/ui/frame';
import frame from '@/landing/components/ui/frame.module.css';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { FINE_LINK } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import form from './authForm.module.css';
import styles from './authPanel.module.css';

export function AuthPanel({
  title,
  lede,
  foot,
  titleRef,
  children,
}: {
  title: ReactNode;
  lede: ReactNode;
  foot?: ReactNode;
  /** For a step that swaps its form for an outcome: focusing the new heading gets it read out. */
  titleRef?: Ref<HTMLHeadingElement>;
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
        <h1
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className='text-[1.875rem] leading-[2.125rem] font-medium tracking-[-0.05rem] outline-none'
        >
          {title}
        </h1>
        <p className='mt-2.5 text-body-sm text-balance text-muted'>{lede}</p>
      </div>

      <div className={styles.body}>{children}</div>

      {foot ? <div className={cn(styles.foot, 'bg-hatch')}>{foot}</div> : null}
    </InkFrame>
  );
}

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

export function PanelLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  // the app lives under another root layout anyway, so a plain link costs nothing
  return isUnlocalizedPath(href) ? (
    <a className={className} href={href}>
      {children}
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function AuthAction({
  note,
  href,
  label,
  secondary,
}: {
  note?: ReactNode;
  href: string;
  label: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <div className={form.root}>
      {note ? <p className={form.note}>{note}</p> : null}
      <PanelLink className={form.primary} href={href}>
        {label}
      </PanelLink>
      {secondary ? (
        <PanelLink className={form.secondary} href={secondary.href}>
          {secondary.label}
        </PanelLink>
      ) : null}
    </div>
  );
}
