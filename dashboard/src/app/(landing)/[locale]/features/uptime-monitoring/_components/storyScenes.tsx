'use client';

import type { ReactNode } from 'react';
import { CircleCheck, CircleX, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { formatUptime } from '@/utils/formatters';
import { ALERTS, EMAIL_SUBJECT, MailIcon, SlackAlert } from './alertMocks';
import { type MockMonitor, StatusPageMock } from './statusPageMock';
import styles from './storyScenes.module.css';

const CHECKS = [
  { at: '10:10', code: '200 OK', ms: '212 ms', ok: true },
  { at: '10:11', code: '200 OK', ms: '208 ms', ok: true },
  { at: '10:12', code: '503 Service Unavailable', ms: '—', ok: false },
];

function Card({ tone, children }: { tone?: 'down'; children: ReactNode }) {
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
    <Card>
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

function Echo({ depth, icon, name, title }: { depth: 1 | 2; icon: ReactNode; name: string; title: string }) {
  return (
    <div className={styles.echo} data-depth={depth}>
      <span className={styles.echoHead}>
        {icon}
        {name}
        <time>{ALERTS.down.at}</time>
      </span>
      <b className={styles.echoTitle}>{title}</b>
    </div>
  );
}

function Alert() {
  return (
    <div className={styles.compose} data-hold>
      <Echo depth={2} icon={<MailIcon />} name='Email' title={EMAIL_SUBJECT} />
      <Echo
        depth={1}
        icon={<Image src='/images/integrations/discord.svg' alt='' width={13} height={13} />}
        name='Discord'
        title={ALERTS.down.title}
      />
      <div className={styles.slack}>
        <SlackAlert alert={ALERTS.down} />
      </div>
    </div>
  );
}

const OUTAGE: MockMonitor[] = [
  { name: 'API', uptime: 0.9991, dips: { 21: 0.97 } },
  { name: 'Checkout', uptime: 0.9996, dips: { 0: 0 }, down: true },
  { name: 'Website', uptime: 1 },
];

function Status() {
  const text = useTranslations('landing.illustrations.uptime');
  const t = useTranslations('landing.uptime.story.stage');
  return (
    <div className={styles.page} data-hold>
      <StatusPageMock
        className={styles.zoomed}
        monitors={OUTAGE}
        days={36}
        headline={text('someDown')}
        outage
        brand={false}
      />
      <div className={styles.suggestion}>
        <span>
          <b>{t('suggested')}</b>
          {t('suggestedBody')}
        </span>
        <span className={styles.write}>{t('write')}</span>
      </div>
    </div>
  );
}

/* 45 days is 64,800 minutes, so 19 minutes down is 99.97% over the window and 98.7% for today: amber. */
const DAYS = 45;

function Recover() {
  const t = useTranslations('landing.uptime.story.scenes');
  const page = useTranslations('landing.uptime.status.page');
  const locale = useLocale();
  return (
    <div className={styles.compose} data-hold>
      <Card>
        <div className={styles.head}>
          <span className={styles.name}>
            <CircleCheck className={styles.ok} aria-hidden />
            <b>Checkout</b>
            <span>checkout.acme.com</span>
          </span>
          <span className={styles.uptime}>{page('uptime', { value: formatUptime(99.97, locale) })}</span>
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
        <div className={styles.slack}>
          <SlackAlert alert={ALERTS.up} />
        </div>
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
