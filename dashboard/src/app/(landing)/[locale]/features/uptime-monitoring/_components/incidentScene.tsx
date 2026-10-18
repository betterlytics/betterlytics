'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { Check, CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { RollingDigits } from '@/landing/components/ui/rollingDigits';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './incidentScene.module.css';

/* Mock data, deliberately untranslated, drawn as the home page's uptime illustration draws it.
   Minutes count from 10:10; Checkout fails from 10:12 until the check at 10:31 passes. */

const MONITORS = [
  { name: 'API', host: 'api.acme.com', ms: 142 },
  { name: 'Checkout', host: 'checkout.acme.com', ms: 208 },
  { name: 'Docs', host: 'docs.acme.com', ms: 88 },
];
const CHECKOUT = 1;
const FAIL_FROM = 2;
const FIRST_PASS = 21;
const CELLS = 30;
/** The minute each step stands at. */
const NOW = [2, 4, 4, 5, 22];
/** What each step looks at; everything else steps back. */
const FOCUS: Part[][] = [['monitors'], ['monitors'], ['notices'], ['status'], ['monitors', 'notices']];
type Part = 'monitors' | 'notices' | 'status';

/* uptime in hundredths of a percent: before, during and after the outage */
const CHECKOUT_UPTIME = [9995, 9993, 9993, 9993, 9991];

const fails = (row: number, minute: number) => row === CHECKOUT && minute >= FAIL_FROM && minute < FIRST_PASS;
const percent = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: value === 10000 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value / 10000);

type State = 'up' | 'failing' | 'down';
const checkoutState = (step: number): State => (step === 0 ? 'failing' : step < 4 ? 'down' : 'up');

function Monitor({ row, step }: { row: number; step: number }) {
  const t = useTranslations('landing.uptime.story.stage');
  const locale = useLocale();
  const now = NOW[step];
  const { name, host, ms } = MONITORS[row];
  const state = row === CHECKOUT ? checkoutState(step) : 'up';
  const uptime = row === CHECKOUT ? CHECKOUT_UPTIME[step] : row === 0 ? 9998 : 10000;
  return (
    <div className={styles.monitor} data-state={state === 'up' ? undefined : state}>
      <i className={styles.dot} />
      <span className={styles.name}>
        <b>
          {name}
          {state !== 'up' && (
            <span className={styles.flag}>
              {state === 'failing' ? t('failingFlag', { count: 1 }) : t('incidentFlag')}
            </span>
          )}
        </b>
        <span className={styles.host}>{host}</span>
      </span>
      <span className={styles.latency}>{state === 'up' ? `${ms} ms` : '503'}</span>
      <span className={styles.strip} style={vars({ '--n': CELLS })}>
        {Array.from({ length: CELLS }, (_, i) => {
          const minute = now - CELLS + 1 + i;
          return <i key={i} data-down={fails(row, minute) || undefined} />;
        })}
      </span>
      <span className={styles.percent}>
        <RollingDigits value={percent(uptime, locale)} direction={-1} />
      </span>
    </div>
  );
}

const CHANNELS = ['/images/integrations/slack.svg', '/images/integrations/discord.svg'];

function Notice({ kind, step }: { kind: 'down' | 'up'; step: number }) {
  const text = useTranslations('landing.illustrations.uptime');
  const t = useTranslations('landing.uptime.story.stage');
  const shown = kind === 'down' ? step >= 2 : step >= 4;
  const behind = kind === 'down' && step >= 4;
  return (
    <div
      className={styles.notice}
      data-kind={kind}
      data-shown={shown || undefined}
      data-behind={behind || undefined}
    >
      <span className={styles.noticeIcon}>
        {kind === 'down' ? (
          <svg viewBox='0 0 20 20' fill='none'>
            <path
              d='M10 2.6a5 5 0 0 0-5 5v3L3.6 13h12.8L15 10.6v-3a5 5 0 0 0-5-5Z'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinejoin='round'
            />
            <path d='M8 15.4a2 2 0 0 0 4 0' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          </svg>
        ) : (
          <svg viewBox='0 0 20 20' fill='none'>
            <path
              d='m5.5 10.4 3 3 6-6.6'
              stroke='currentColor'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        )}
      </span>
      <span className={styles.noticeText}>
        <b>{kind === 'down' ? text('downTitle', { name: 'Checkout' }) : text('upTitle', { name: 'Checkout' })}</b>
        <span>{kind === 'down' ? text('downDetail', { host: 'checkout.acme.com' }) : t('upDetail')}</span>
      </span>
      <time>{kind === 'down' ? '10:14' : '10:32'}</time>
      <span className={styles.channels}>
        {text('sentTo')}
        {CHANNELS.map((src) => (
          <span key={src} className={styles.channel}>
            <Image src={src} alt='' width={12} height={12} />
          </span>
        ))}
        <span className={styles.channel}>
          <svg viewBox='0 0 16 16' fill='none'>
            <rect x='2' y='3.5' width='12' height='9' rx='1.6' stroke='currentColor' strokeWidth='1.3' />
            <path d='m2.6 4.4 5.4 4.1 5.4-4.1' stroke='currentColor' strokeWidth='1.3' strokeLinejoin='round' />
          </svg>
        </span>
      </span>
    </div>
  );
}

/** Public monitors, with the day (counted from the oldest) that dipped below 99%. */
const PUBLIC = [
  { name: 'API', dip: 14 },
  { name: 'Checkout', dip: undefined },
  { name: 'Website', dip: undefined },
];
const DAYS = 36;

/** After app/status/[slug], as the status-page section draws it: brand band, status hero, monitor card. */
function StatusPage({ step }: { step: number }) {
  const text = useTranslations('landing.illustrations.uptime');
  const t = useTranslations('landing.uptime.story.stage');
  // the banner follows the monitors on its own; the incident write-up waits for a person
  const out = checkoutState(step) === 'down';
  return (
    <div className={styles.status} data-down={out || undefined}>
      <div className={styles.chrome}>
        <i />
        <i />
        <i />
        <span>status.acme.com</span>
      </div>
      <div className={styles.viewport}>
        <div className={styles.band}>
          <b className={styles.brand}>
            <i />
            Acme
          </b>
        </div>
        <div className={styles.statusCard}>
          <div className={styles.hero}>
            <span className={styles.heroIcon}>
              {out ? <TriangleAlert strokeWidth={2.6} /> : <Check strokeWidth={3} />}
            </span>
            <strong>{out ? text('someDown') : text('allUp')}</strong>
          </div>
          <div className={styles.statusRows}>
            {PUBLIC.map(({ name, dip }) => {
              const down = out && name === 'Checkout';
              return (
                <div key={name} className={styles.statusRow} data-down={down || undefined}>
                  {down ? <CircleX /> : <CircleCheck />}
                  <b>{name}</b>
                  <span className={styles.badge}>{down ? text('down') : text('operational')}</span>
                  <span className={styles.history}>
                    {Array.from({ length: DAYS }, (_, i) => (
                      <i key={i} data-dip={i === dip || undefined} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.suggestion} data-shown={step === 3 || undefined}>
          <span>
            <b>{t('suggested')}</b>
            {t('suggestedBody')}
          </span>
          <span className={styles.write}>{t('write')}</span>
        </div>
      </div>
    </div>
  );
}

function Layer({
  part,
  step,
  className,
  children,
}: {
  part: Part;
  step: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(styles.layer, className)} data-focus={FOCUS[step].includes(part) || undefined}>
      {children}
    </div>
  );
}

export function IncidentScene({ step }: { step: number }) {
  return (
    <div className={styles.scene} data-step={step}>
      <Layer part='status' step={step} className={styles.statusLayer}>
        <StatusPage step={step} />
      </Layer>
      <Layer part='monitors' step={step} className={styles.monitorsLayer}>
        <div className={styles.monitors}>
          {MONITORS.map((monitor, row) => (
            <Monitor key={monitor.name} row={row} step={step} />
          ))}
        </div>
      </Layer>
      <Layer part='notices' step={step} className={styles.noticesLayer}>
        <Notice kind='down' step={step} />
        <Notice kind='up' step={step} />
      </Layer>
    </div>
  );
}
