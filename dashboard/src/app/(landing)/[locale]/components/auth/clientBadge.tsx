import { useTranslations } from 'next-intl';
import { cn } from '@/landing/lib/cn';
import styles from './consent.module.css';

const ICONS = {
  check: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5Z M5.5 8.25l1.75 1.75 3.25-3.5',
  triangle: 'M7.13 2.5a1 1 0 0 1 1.74 0l5.4 9.5a1 1 0 0 1-.87 1.5H2.6a1 1 0 0 1-.87-1.5Z M8 6.25v3 M8 11.1v.01',
  alert: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5Z M8 4.75V8.5 M8 11v.01',
  info: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5Z M8 7.25V11 M8 5v.01',
  search: 'M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z m3.5 8 3 3',
  history: 'M2.5 8a5.5 5.5 0 1 0 1.6-3.9 M2.25 2.5v2.25H4.5 M8 5.25V8l2 1.5',
} as const;

export function ConsentIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox='0 0 16 16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Whether we can vouch for an MCP client, next to its name wherever the connection is asked for. */
export function ClientBadge({ verified, className }: { verified: boolean; className?: string }) {
  const t = useTranslations('public.auth.consent.facts');
  const label = verified ? t('verified') : t('unverified');
  return (
    <span
      className={cn(styles.badge, verified ? styles.badgeOk : styles.badgeWarn, className)}
      role='img'
      tabIndex={0}
      aria-label={label}
      data-tip={label}
    >
      <ConsentIcon name={verified ? 'check' : 'triangle'} />
    </span>
  );
}
