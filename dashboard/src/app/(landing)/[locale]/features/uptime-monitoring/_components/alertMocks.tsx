'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './alertMocks.module.css';

export const SITE = 'https://checkout.acme.com';
export const MONITOR_URL = 'https://betterlytics.io/dashboard/…/monitoring/…';
export const URL_TITLE = 'View Monitor';
export const EMAIL_SUBJECT = 'Uptime Alert: Site Is Down: Checkout';

export type MockAlert = { at: string; title: string; outcome: string; color: string };

export const ALERTS = {
  down: { at: '10:14', title: 'Checkout is down', outcome: 'is not responding', color: '#EF4444' },
  up: { at: '10:32', title: 'Checkout is back up', outcome: 'has recovered after 19m', color: '#10B981' },
} satisfies Record<string, MockAlert>;

export const messageOf = (alert: MockAlert) => `Checkout (${SITE}) ${alert.outcome}`;

export function MailIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg viewBox='0 0 16 16' fill='none' className={className} aria-hidden>
      <rect x='2' y='3.5' width='12' height='9' rx='1.6' stroke='currentColor' strokeWidth='1.4' />
      <path d='m2.6 4.4 5.4 4.1 5.4-4.1' stroke='currentColor' strokeWidth='1.4' strokeLinejoin='round' />
    </svg>
  );
}

export function AlertMessage({
  at,
  app = false,
  className,
  style,
  children,
}: {
  at: string;
  app?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const t = useTranslations('landing.uptime.alerts');
  return (
    <div className={cn(styles.message, className)} style={style}>
      <span className={styles.avatar}>
        <BrandMark />
      </span>
      <div className='min-w-0'>
        <p className={styles.sender}>
          <b>Betterlytics</b>
          {app && <span className={styles.app}>{t('app')}</span>}
          <time>{at}</time>
        </p>
        {children}
      </div>
    </div>
  );
}

export function SlackAlert({ alert, style }: { alert: MockAlert; style?: CSSProperties }) {
  return (
    <AlertMessage at={alert.at} app style={style}>
      <div className={styles.attachment} style={vars({ '--bar': alert.color })}>
        <b>{alert.title}</b>
        <p>
          Checkout (<span className={styles.link}>{SITE}</span>) {alert.outcome}
        </p>
        <p className={styles.link}>{URL_TITLE}</p>
      </div>
    </AlertMessage>
  );
}
