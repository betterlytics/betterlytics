'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { Scramble } from '@/landing/components/ui/scramble';
import { vars } from '@/landing/lib/cssVars';
import styles from './alertsPanel.module.css';

/* What the backend sends (notifications/integrations/{slack,webhook}.rs, monitor/service.rs), left literal. */
const SITE = 'https://checkout.acme.com';
const ALERTS = [
  { at: '10:14', title: 'Checkout is down', outcome: 'is not responding', color: '#EF4444' },
  { at: '10:32', title: 'Checkout is back up', outcome: 'has recovered after 19m', color: '#10B981' },
];
const messageOf = (outcome: string) => `Checkout (${SITE}) ${outcome}`;
const MONITOR_URL = 'https://betterlytics.io/dashboard/…/monitoring/…';
const URL_TITLE = 'View Monitor';

/* The down email (services/email/template/monitor-down-mail.tsx), also English-only in the product. */
const EMAIL_ROWS = [
  ['URL', SITE],
  ['Time', '2026-10-18 10:14:07 UTC'],
  ['Status Code', '503'],
  ['Reason', 'Server returned a server error'],
];

type View = 'slack' | 'email' | 'webhook';

const logo = (src: string) => <Image src={src} alt='' width={12} height={12} />;

const VIEWS: { key: View; glyph: ReactNode }[] = [
  { key: 'slack', glyph: logo('/images/integrations/slack.svg') },
  {
    key: 'email',
    glyph: (
      <svg viewBox='0 0 16 16' fill='none' className='size-3'>
        <rect x='2' y='3.5' width='12' height='9' rx='1.6' stroke='currentColor' strokeWidth='1.4' />
        <path d='m2.6 4.4 5.4 4.1 5.4-4.1' stroke='currentColor' strokeWidth='1.4' strokeLinejoin='round' />
      </svg>
    ),
  },
  { key: 'webhook', glyph: logo('/images/integrations/webhook.svg') },
];

function Slack() {
  const t = useTranslations('landing.uptime.alerts');
  return (
    <div className={styles.chat}>
      <p className={styles.day}>
        <span>{t('today')}</span>
      </p>
      {ALERTS.map(({ at, title, outcome, color }, i) => (
        <div key={at} className={styles.message} style={{ animationDelay: `${0.2 + i * 0.5}s` }}>
          <span className={styles.avatar}>
            <BrandMark />
          </span>
          <div className='min-w-0'>
            <p className={styles.sender}>
              <b>Betterlytics</b>
              <span className={styles.app}>{t('app')}</span>
              <time>{at}</time>
            </p>
            <div className={styles.attachment} style={vars({ '--bar': color })}>
              <b>{title}</b>
              <p>
                Checkout (<span className={styles.link}>{SITE}</span>) {outcome}
              </p>
              <p className={styles.link}>{URL_TITLE}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Email() {
  return (
    <div className={styles.mail}>
      <div className={styles.mailHead}>
        <span className={styles.avatar}>
          <BrandMark />
        </span>
        <div className='min-w-0'>
          <p className={styles.sender}>
            <b>Betterlytics</b>
            <time>10:14</time>
          </p>
          <p className={styles.subject}>Uptime Alert: Site Is Down: Checkout</p>
        </div>
      </div>
      <div className={styles.mailBody}>
        <p className={styles.mailBrand}>
          <BrandMark className='size-5' />
          Betterlytics
        </p>
        <b className={styles.mailTitle}>Monitor Alert</b>
        <div className={styles.mailBox}>
          <b>Monitor Down</b>
          <p>
            <strong>Checkout</strong> is currently unreachable.
          </p>
        </div>
        <div className={styles.mailRows}>
          {EMAIL_ROWS.map(([label, value]) => (
            <p key={label}>
              <strong>{label}:</strong>{' '}
              {label === 'URL' ? <span className={styles.mailLink}>{value}</span> : value}
            </p>
          ))}
        </div>
        <span className={styles.mailButton}>View Monitor Details</span>
      </div>
    </div>
  );
}

function Payload() {
  const t = useTranslations('landing.uptime.alerts');
  return (
    <pre className={styles.code} aria-label={t('payload')}>
      {ALERTS.map(({ at, title, outcome, color }, p) => {
        const fields = [
          ['title', title],
          ['message', messageOf(outcome)],
          ['color', color],
          ['url', MONITOR_URL],
          ['url_title', URL_TITLE],
        ];
        return (
          <code key={at} className={styles.block} style={{ animationDelay: `${0.2 + p * 0.5}s` }}>
            <span className={styles.comment}>{`// ${at}\n`}</span>
            <span className={styles.punct}>{'{\n'}</span>
            {fields.map(([key, value], i) => (
              <span key={key}>
                {'  '}
                <span className={styles.key}>&quot;{key}&quot;</span>
                <span className={styles.punct}>: </span>
                <span className={styles.value}>
                  {key === 'color' && <i className={styles.swatch} style={{ background: value }} />}&quot;{value}
                  &quot;
                </span>
                {i < fields.length - 1 && <span className={styles.punct}>,</span>}
                {'\n'}
              </span>
            ))}
            <span className={styles.punct}>{'}'}</span>
          </code>
        );
      })}
    </pre>
  );
}

const PANES: Record<View, () => ReactNode> = { slack: Slack, email: Email, webhook: Payload };

/** The same alert where people read it (Slack, email) and as the raw webhook for developers. */
export function AlertPreview() {
  const t = useTranslations('landing.uptime.alerts');
  const [view, setView] = useState<View>('slack');
  return (
    <div className={styles.terminal}>
      <div className={styles.bar}>
        <div className={styles.tabs} role='group' aria-label={t('channels')}>
          {VIEWS.map(({ key, glyph }) => (
            <button key={key} type='button' aria-pressed={view === key} onClick={() => setView(key)}>
              {glyph}
              {t(`views.${key}`)}
            </button>
          ))}
        </div>
        <span className='ml-auto flex min-w-0 items-center gap-2 whitespace-nowrap max-sm:hidden'>
          {view === 'webhook' && <span className={styles.method}>POST</span>}
          <Scramble
            align='end'
            className='min-w-0 truncate'
            text={{ slack: `# ${t('channel')}`, email: t('inbox'), webhook: 'hooks.acme.com/betterlytics' }[view]}
          />
        </span>
      </div>
      {/* every view shares one cell, so switching never changes the panel's height */}
      <div className={styles.views}>
        {VIEWS.map(({ key }) => {
          const Pane = PANES[key];
          return (
            <div key={key} data-active={view === key || undefined} aria-hidden={view !== key}>
              <Pane />
            </div>
          );
        })}
      </div>
      <p className={styles.note}>{t(`notes.${view}`)}</p>
    </div>
  );
}
