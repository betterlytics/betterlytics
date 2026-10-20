'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { Scramble } from '@/landing/components/ui/scramble';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import {
  ALERTS,
  AlertMessage,
  EMAIL_SUBJECT,
  MailIcon,
  MONITOR_URL,
  SITE,
  SlackAlert,
  URL_TITLE,
  messageOf,
} from './alertMocks';
import styles from './alertPreview.module.css';

const SENT = [ALERTS.down, ALERTS.up];

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
  { key: 'email', glyph: <MailIcon /> },
  { key: 'webhook', glyph: logo('/images/integrations/webhook.svg') },
];

function Slack() {
  const t = useTranslations('landing.uptime.alerts');
  return (
    <div className={styles.chat}>
      <p className={styles.day}>
        <span>{t('today')}</span>
      </p>
      {SENT.map((alert, i) => (
        <SlackAlert key={alert.at} alert={alert} style={{ animationDelay: `${0.2 + i * 0.5}s` }} />
      ))}
    </div>
  );
}

function Email() {
  return (
    <div className={styles.mail}>
      <AlertMessage at={ALERTS.down.at} className='items-center'>
        <p className={styles.subject}>{EMAIL_SUBJECT}</p>
      </AlertMessage>
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
  return (
    <pre className={styles.code}>
      {SENT.map((alert, p) => {
        const fields = [
          ['title', alert.title],
          ['message', messageOf(alert)],
          ['color', alert.color],
          ['url', MONITOR_URL],
          ['url_title', URL_TITLE],
        ];
        return (
          <code key={alert.at} className={styles.block} style={{ animationDelay: `${0.2 + p * 0.5}s` }}>
            <span className={styles.comment}>{`// ${alert.at}\n`}</span>
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

export function AlertPreview() {
  const t = useTranslations('landing.uptime.alerts');
  const [view, setView] = useState<View>('slack');
  return (
    <div className={styles.terminal}>
      <div className={styles.bar}>
        <div
          className={styles.tabs}
          role='tablist'
          aria-label={t('channels')}
          onKeyDown={rovingTabKeys(
            VIEWS.findIndex(({ key }) => key === view),
            VIEWS.length,
            (i) => setView(VIEWS[i].key),
          )}
        >
          {VIEWS.map(({ key, glyph }) => (
            <button
              key={key}
              type='button'
              role='tab'
              id={`alert-tab-${key}`}
              aria-selected={view === key}
              aria-controls={`alert-panel-${key}`}
              tabIndex={view === key ? 0 : -1}
              onClick={() => setView(key)}
            >
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
      <div className={styles.views}>
        {VIEWS.map(({ key }) => {
          const Pane = PANES[key];
          return (
            <div
              key={key}
              id={`alert-panel-${key}`}
              role='tabpanel'
              aria-labelledby={`alert-tab-${key}`}
              tabIndex={view === key ? 0 : -1}
              data-active={view === key || undefined}
            >
              <Pane />
            </div>
          );
        })}
      </div>
      <p className={styles.note}>{t(`notes.${view}`)}</p>
    </div>
  );
}
