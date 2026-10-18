'use client';

import type { ReactNode } from 'react';
import { CircleCheck, CircleX, Mail, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { vars } from '@/landing/lib/cssVars';
import alerts from './alertsPanel.module.css';
import { OutageStatusPage } from './outageStatusPage';
import styles from './storyScenes.module.css';

/* One focused illustration per step, crossfading, each over the step's colour in the hatch and with one
   supporting piece for depth. Mock data stays literal, as elsewhere. */

const CHECKS = [
  { at: '10:10', code: '200 OK', ms: '212 ms', ok: true },
  { at: '10:11', code: '200 OK', ms: '208 ms', ok: true },
  { at: '10:12', code: '503 Service Unavailable', ms: '—', ok: false },
];

function Card({ tone, children }: { tone?: 'down' | 'live' | 'warn'; children: ReactNode }) {
  return (
    <div className={styles.card} data-tone={tone}>
      {children}
    </div>
  );
}

function MonitorHead({ state }: { state: 'failing' | 'down' }) {
  const t = useTranslations('landing.uptime.story.scenes');
  return (
    <div className={styles.head}>
      <span className={styles.name}>
        <i className={styles.dot} data-state={state} />
        <b>Checkout</b>
        <span>checkout.acme.com</span>
      </span>
      <span className={styles.pill} data-state={state}>
        {t(state)}
      </span>
    </div>
  );
}

function CheckLog() {
  const t = useTranslations('landing.uptime.story.scenes');
  return (
    <Card tone='warn'>
      <MonitorHead state='failing' />
      <p className={styles.label}>{t('recentChecks')}</p>
      <ul className={styles.checks}>
        {CHECKS.map(({ at, code, ms, ok }) => (
          <li key={at} data-failed={!ok || undefined}>
            <time>{at}</time>
            <span className={styles.method}>GET</span>
            <span className={styles.code}>{code}</span>
            <span className={styles.ms}>{ms}</span>
            {ok ? <CircleCheck aria-hidden /> : <CircleX aria-hidden />}
          </li>
        ))}
      </ul>
      <p className={styles.foot}>
        <span className={styles.chip}>{t('failedOf', { count: 1 })}</span>
        {t('waiting')}
      </p>
    </Card>
  );
}

function Fail() {
  return (
    <div className={styles.compose} data-hold>
      <CheckLog />
      <span className={styles.floatChip}>
        <RefreshCw aria-hidden />1 min
      </span>
    </div>
  );
}

function Confirm() {
  const t = useTranslations('landing.uptime.story.scenes');
  return (
    <div className={styles.compose} data-hold>
      {/* the check log it grew out of, one step back */}
      <div className={styles.behind}>
        <CheckLog />
      </div>
      <Card tone='down'>
        <div className={styles.banner}>
          <CircleX aria-hidden />
          <b>{t('incidentOpened')}</b>
          <time>10:14</time>
        </div>
        <MonitorHead state='down' />
        <dl className={styles.facts}>
          <div>
            <dt>{t('reason')}</dt>
            <dd>HTTP 5xx · 503 Service Unavailable</dd>
          </div>
          <div>
            <dt>{t('started')}</dt>
            <dd>{t('startedValue')}</dd>
          </div>
        </dl>
        <span className={styles.trail} aria-hidden>
          {['up', 'up', 'down', 'down', 'down'].map((state, i) => (
            <i key={i} data-state={state} />
          ))}
        </span>
      </Card>
    </div>
  );
}

function Slack({ kind }: { kind: 'down' | 'up' }) {
  const t = useTranslations('landing.uptime.alerts');
  const down = kind === 'down';
  return (
    <div className={styles.slack}>
      <div className={alerts.message}>
        <span className={alerts.avatar}>
          <BrandMark />
        </span>
        <div className='min-w-0'>
          <p className={alerts.sender}>
            <b>Betterlytics</b>
            <span className={alerts.app}>{t('app')}</span>
            <time>{down ? '10:14' : '10:32'}</time>
          </p>
          <div className={alerts.attachment} style={vars({ '--bar': down ? '#EF4444' : '#10B981' })}>
            <b>{down ? 'Checkout is down' : 'Checkout is back up'}</b>
            <p>
              Checkout (<span className={alerts.link}>https://checkout.acme.com</span>){' '}
              {down ? 'is not responding' : 'has recovered after 19m'}
            </p>
            <p className={alerts.link}>View Monitor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The same alert in another channel, stacked behind the Slack message like grouped notifications;
    hovering the stack spreads it, so each one's title shows. */
function Echo({ depth, icon, name, title }: { depth: 1 | 2; icon: ReactNode; name: string; title: string }) {
  return (
    <div className={styles.echo} data-depth={depth}>
      <span className={styles.echoHead}>
        {icon}
        {name}
        <time>10:14</time>
      </span>
      <b className={styles.echoTitle}>{title}</b>
    </div>
  );
}

function Alert() {
  return (
    <div className={styles.compose} data-hold>
      <Echo depth={2} icon={<Mail aria-hidden />} name='Email' title='Uptime Alert: Site Is Down: Checkout' />
      <Echo
        depth={1}
        icon={<Image src='/images/integrations/discord.svg' alt='' width={13} height={13} />}
        name='Discord'
        title='Checkout is down'
      />
      <Slack kind='down' />
    </div>
  );
}

function Status() {
  return (
    <div className={styles.page} data-hold>
      <OutageStatusPage />
    </div>
  );
}

/* The status page's monitor row at its 45-day compact width: one bar a day, and today, with 19 minutes down
   (98.7%), amber by the real page's 95%/99% cut-offs. 45 days is 64,800 minutes, so 99.97% over the window. */
const DAYS = 45;

function Recover() {
  const t = useTranslations('landing.uptime.story.scenes');
  const page = useTranslations('landing.uptime.status.page');
  const locale = useLocale();
  const uptime = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2 }).format(0.9997);
  return (
    <div className={styles.compose} data-hold>
      <Card tone='live'>
        <div className={styles.head}>
          <span className={styles.name}>
            <CircleCheck className={styles.ok} aria-hidden />
            <b>Checkout</b>
            <span>checkout.acme.com</span>
          </span>
          <span className={styles.uptime}>{page('uptime', { value: uptime })}</span>
        </div>
        <span className={styles.bars} aria-hidden>
          {Array.from({ length: DAYS }, (_, i) => (
            <i key={i} data-warn={i === DAYS - 1 || undefined} />
          ))}
        </span>
        <span className={styles.axis}>
          <span>{page('ago', { days: DAYS })}</span>
          <span>{page('today')}</span>
        </span>
        <dl className={styles.stats}>
          <div>
            <dt>{t('downFor')}</dt>
            <dd>19m</dd>
          </div>
          <div>
            <dt>{t('backAt')}</dt>
            <dd>10:31</dd>
          </div>
          <div>
            <dt>{t('alertsSent')}</dt>
            <dd>2</dd>
          </div>
        </dl>
      </Card>
      <div className={styles.toast}>
        <Slack kind='up' />
      </div>
    </div>
  );
}

const SCENES = [
  { Scene: Fail, glow: 'warn' },
  { Scene: Confirm, glow: 'down' },
  { Scene: Alert, glow: 'volt' },
  { Scene: Status, glow: 'ember' },
  { Scene: Recover, glow: 'live' },
] as const;

export function StoryScenes({ step }: { step: number }) {
  return (
    <div className={styles.scenes}>
      {SCENES.map(({ Scene, glow }, i) => (
        <div key={i} className={styles.scene} data-glow={glow} data-active={i === step || undefined}>
          <Scene />
        </div>
      ))}
    </div>
  );
}
