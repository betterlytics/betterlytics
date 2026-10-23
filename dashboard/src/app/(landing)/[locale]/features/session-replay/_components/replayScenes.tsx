'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Bug, CircleX, Keyboard, Monitor, MousePointer2, Play, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FLAGS, type FlagCode } from '@/landing/components/illustrations/flags';
import { CursorGlyph } from '@/landing/components/ui/cursorGlyph';
import { vars } from '@/landing/lib/cssVars';
import { CheckoutMock } from './checkoutMock';
import styles from './replayScenes.module.css';
import visit from './replayVisit.module.css';

/* Values are mock data, left literal; labels are copy. */

type Scenes = ReturnType<typeof useTranslations<'landing.replay.story.scenes'>>;

const SITE_URL = 'northwind.coffee/checkout';

function Browser({ children, rec }: { children: ReactNode; rec: string }) {
  return (
    <div className={styles.browser}>
      <div className={styles.bar}>
        <span className={styles.lights}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.url}>{SITE_URL}</span>
        <span className={styles.rec}>
          <i />
          {rec}
        </span>
      </div>
      <div className={styles.viewport}>{children}</div>
    </div>
  );
}

/** Single-colour marks, drawn in the text colour as the dashboard does in dark mode. */
const OS_ICONS = {
  apple: '/os-icons/apple-dark.svg',
  windows: '/os-icons/windows.svg',
};

function Meta({
  flag,
  browser,
  os,
  device = 'desktop',
}: {
  flag: FlagCode;
  browser: string;
  os: keyof typeof OS_ICONS;
  device?: 'desktop' | 'mobile';
}) {
  const Flag = FLAGS[flag];
  const Device = device === 'desktop' ? Monitor : Smartphone;
  return (
    <span className={styles.meta}>
      <Flag className={styles.flag} />
      <Image src={`/browser-icons/${browser}.svg`} alt='' width={12} height={12} />
      <span className={styles.os} data-os={os} style={vars({ '--src': `url(${OS_ICONS[os]})` })} />
      <Device />
    </span>
  );
}

function ErrorCard({ t, className }: { t: Scenes; className: string }) {
  return (
    <div className={`${styles.card} ${className}`} data-tone='down'>
      <div className={styles.banner}>
        <CircleX aria-hidden />
        <b>{t('newError')}</b>
        <time>14:03</time>
      </div>
      <div className={styles.errorHead}>
        <b>TypeError</b>
        <span>Cannot read properties of undefined (reading &apos;postcode&apos;)</span>
      </div>
      <pre className={styles.stack}>
        <span>
          at <b>validateAddress</b> (checkout.js:212:18)
        </span>
        <span>
          at <b>onPay</b> (checkout.js:188:5)
        </span>
      </pre>
      <div className={styles.errorFoot}>
        <span className={styles.path}>/checkout</span>
        <Meta flag='DK' browser='chrome' os='apple' />
        <span className={styles.count}>{t('occurrences', { count: 1 })}</span>
      </div>
    </div>
  );
}

/** The first row is the visit itself: its thumbnail and bar are the window and the tape, landed in place. */
const SESSIONS = [
  { ago: 'now', duration: '2m 14s', path: '/', flag: 'DK', browser: 'chrome', os: 'apple', errors: 1 },
  {
    ago: 12,
    duration: '48s',
    path: '/subscriptions',
    flag: 'SE',
    browser: 'firefox',
    os: 'windows',
    ticks: [
      [14, 'click'],
      [30, 'scroll'],
      [52, 'input'],
      [71, 'click'],
    ],
  },
  {
    ago: 31,
    duration: '3m 05s',
    path: '/',
    flag: 'DE',
    browser: 'safari',
    os: 'apple',
    device: 'mobile',
    ticks: [
      [6, 'scroll'],
      [19, 'click'],
      [27, 'input'],
      [45, 'input'],
      [58, 'click'],
      [66, 'scroll'],
      [88, 'click'],
    ],
  },
] as const;

function SessionList({ t }: { t: Scenes }) {
  return (
    <div className={`${styles.card} ${visit.list}`}>
      <p className={visit.listHead}>{t('sessions')}</p>
      <ul>
        {SESSIONS.map((session, i) => (
          <li key={i} className={visit.row} data-own={i === 0 || undefined} style={vars({ '--i': i })}>
            <span className={visit.thumb}>
              <i />
              <i />
              <i />
            </span>
            <span className={visit.who}>
              <b>{session.ago === 'now' ? t('justNow') : t('minutesAgo', { count: session.ago })}</b>
              {session.path}
            </span>
            <span className={visit.bar}>
              {'ticks' in session && (
                <span className={`${visit.track} ${visit.mini}`}>
                  <i className={visit.rail}>
                    <i className={visit.played} />
                  </i>
                  {session.ticks.map(([x, kind]) => (
                    <i key={x} data-kind={kind} data-state='shown' style={vars({ '--x': x / 100 })} />
                  ))}
                </span>
              )}
            </span>
            <span className={visit.duration}>{session.duration}</span>
            <Meta
              flag={session.flag}
              browser={session.browser}
              os={session.os}
              device={'device' in session ? session.device : undefined}
            />
            {'errors' in session && (
              <span className={visit.bug}>
                <Bug aria-hidden />
                {session.errors}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Marker colours follow the player's: clicks blue, scrolls amber, inputs rose. */
const TICKS = [
  [3, 'click'],
  [8, 'scroll'],
  [13, 'scroll'],
  [21, 'click'],
  [27, 'input'],
  [31, 'input'],
  [36, 'input'],
  [44, 'click'],
  [52, 'scroll'],
  [58, 'input'],
  [63, 'input'],
  [70, 'click'],
  [75, 'error'],
  [77, 'click'],
  [86, 'scroll'],
  [93, 'click'],
] as const;

const ERROR = 0.75;
/**
 * Each step: how far the recording has got (`to`), and the head's run, recording at first and the playhead later.
 * The first run lasts the whole step (replayStory's 5.6 s dwell) and the second keeps its speed, so the head never pauses.
 */
const RUNS = [
  { to: 0.62, head: [0, 0.62], delay: 0.5, dur: 5.1, ease: 'linear' },
  { to: ERROR, head: [0.62, ERROR], delay: 0, dur: 1.1, ease: 'linear' },
  { to: 1, head: [ERROR, 1], delay: 0, dur: 0.4, ease: 'linear' },
  { to: 1, head: [0, ERROR], delay: 1.4, dur: 0.9, ease: 'var(--ease-out-expo)' },
  { to: 1, head: [ERROR, ERROR], delay: 0, dur: 0.1, ease: 'linear' },
] as const;

/** Icons and colours are the replayer's timeline: Mouse Interaction, Input and client_error. */
const EVENTS = [
  { at: '1:32', key: 'input', Icon: Keyboard },
  { at: '1:38', key: 'click', Icon: MousePointer2 },
  { at: '1:41', key: 'clientError', Icon: AlertTriangle },
  { at: '1:43', key: 'click', Icon: MousePointer2 },
] as const;

/**
 * One visit, drawn once. Every step moves the same window, tape and cards instead of swapping pictures, so any
 * step animates into any other.
 */
function Visit({ t, step }: { t: Scenes; step: number }) {
  const from = step ? RUNS[step - 1].to : 0;
  const { to, head, delay, dur, ease } = RUNS[step];
  const tickDelay = (x: number) => (to > from ? delay + ((x - from) / (to - from)) * dur : 0);
  return (
    <div className={visit.visit} data-step={step}>
      <div className={visit.canvas}>
        <SessionList t={t} />
        <div className={visit.player}>
          <div className={visit.playerTop}>
            <span>
              {t('start')} <b>/</b>
            </span>
            <Meta flag='DK' browser='chrome' os='apple' />
          </div>
          <div className={visit.controls}>
            <Play aria-hidden />
            <span className={visit.clock}>1:41 / 2:14</span>
            <span className={visit.toggle}>
              <i />
              {t('skip')}
            </span>
            <b>8×</b>
          </div>
        </div>
        <div className={visit.win}>
          <Browser rec={t('recording')}>
            <CheckoutMock className={visit.page} adorn={{ pay: <span className={visit.payClick} /> }} />
            <CheckoutMock
              masked
              flagPostcode={step === 4}
              className={`${visit.page} ${visit.masked}`}
              adorn={{
                postcode: (
                  <span className={visit.note} data-note='empty'>
                    {t('emptyField')}
                  </span>
                ),
                pay: (
                  <>
                    <span className={visit.clicks}>
                      <i />
                      <i />
                      <span className={visit.cursor}>
                        <CursorGlyph />
                      </span>
                    </span>
                  </>
                ),
              }}
            />
          </Browser>
        </div>
        <div
          className={`${visit.track} ${visit.tape}`}
          style={vars({
            '--head-from': head[0],
            '--head-to': head[1],
            '--delay': `${delay}s`,
            '--dur': `${dur}s`,
            '--ease': ease,
          })}
        >
          {/* keyed by step, so the handle and its fill run again from where the last step left them */}
          <i className={visit.rail}>
            <i key={`played-${step}`} className={visit.played} />
          </i>
          {TICKS.map(([x, kind]) => {
            const where = x / 100;
            return (
              <i
                key={x}
                data-kind={kind}
                data-state={where <= from ? 'shown' : where <= to ? 'due' : undefined}
                style={vars({ '--x': where, '--d': `${tickDelay(where)}s` })}
              />
            );
          })}
          <i key={`head-${step}`} className={visit.head} />
        </div>
        <span className={visit.tip}>{t('clientError')}</span>
        <ErrorCard t={t} className={visit.error} />
        <div className={`${styles.card} ${visit.events}`}>
          <p className={styles.cardHead}>{t('timeline')}</p>
          <ul>
            {EVENTS.map(({ at, key, Icon }, i) => (
              <li key={at} data-kind={key} style={vars({ '--i': i })}>
                <time>{at}</time>
                <Icon aria-hidden />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ReplayScenes({ step }: { step: number }) {
  const t = useTranslations('landing.replay.story.scenes');
  return (
    <div className={styles.scenes}>
      <Visit t={t} step={step} />
    </div>
  );
}
