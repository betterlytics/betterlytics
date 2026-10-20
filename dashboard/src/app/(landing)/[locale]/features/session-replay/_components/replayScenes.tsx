'use client';

import type { ReactNode } from 'react';
import { Bug, CircleX, Monitor, Play, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FLAGS, type FlagCode } from '@/landing/components/illustrations/flags';
import { CursorGlyph } from '@/landing/components/ui/cursorGlyph';
import { vars } from '@/landing/lib/cssVars';
import { CheckoutMock } from './checkoutMock';
import styles from './replayScenes.module.css';

/* Values are mock data, left literal; labels are copy. */

type Scenes = ReturnType<typeof useTranslations<'landing.replay.story.scenes'>>;

const SITE_URL = 'northwind.coffee/checkout';

function Browser({ children, rec }: { children: ReactNode; rec?: string }) {
  return (
    <div className={styles.browser}>
      <div className={styles.bar}>
        <span className={styles.lights}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.url}>{SITE_URL}</span>
        {rec && (
          <span className={styles.rec}>
            <i />
            {rec}
          </span>
        )}
      </div>
      <div className={styles.viewport}>{children}</div>
    </div>
  );
}

function Meta({
  flag,
  browser,
  os,
  device = 'desktop',
}: {
  flag: FlagCode;
  browser: string;
  os: string;
  device?: 'desktop' | 'mobile';
}) {
  const Flag = FLAGS[flag];
  const Device = device === 'desktop' ? Monitor : Smartphone;
  return (
    <span className={styles.meta}>
      <Flag className={styles.flag} />
      <Image src={`/browser-icons/${browser}.svg`} alt='' width={12} height={12} />
      <Image src={`/os-icons/${os}.svg`} alt='' width={12} height={12} />
      <Device />
    </span>
  );
}

const CHUNKS = [
  { n: 1, size: '18 KB' },
  { n: 2, size: '9 KB' },
  { n: 3, size: '12 KB' },
];

function Recording({ t }: { t: Scenes }) {
  return (
    <div className={styles.compose}>
      <Browser rec={t('recording')}>
        <CheckoutMock className={styles.zoomed} />
      </Browser>
      <span className={styles.floatChip}>{t('sampled')}</span>
      <ul className={styles.chunks}>
        {CHUNKS.map(({ n, size }, i) => (
          <li key={n} style={vars({ '--i': i })}>
            <span>{t('chunk', { n })}</span>
            {size}
            <b>gzip</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorCard({ t }: { t: Scenes }) {
  return (
    <div className={styles.card} data-tone='down'>
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

function Thrown({ t }: { t: Scenes }) {
  return (
    <div className={styles.compose}>
      <div className={styles.behind}>
        <Browser>
          <CheckoutMock className={styles.zoomed} />
        </Browser>
      </div>
      <ErrorCard t={t} />
    </div>
  );
}

const SESSIONS = [
  { ago: 'now', duration: '2m 14s', path: '/', flag: 'DK', browser: 'chrome', os: 'apple', errors: 1 },
  { ago: 12, duration: '48s', path: '/subscriptions', flag: 'SE', browser: 'firefox', os: 'windows' },
  { ago: 31, duration: '3m 05s', path: '/', flag: 'DE', browser: 'safari', os: 'apple', device: 'mobile' },
] as const;

function Ready({ t }: { t: Scenes }) {
  return (
    <div className={styles.compose}>
      <div className={styles.card}>
        <p className={styles.cardHead}>{t('sessions')}</p>
        <ul className={styles.sessions}>
          {SESSIONS.map((session, i) => (
            <li key={i} data-new={i === 0 || undefined} style={vars({ '--i': i })}>
              <span className={styles.ago}>
                {session.ago === 'now' ? t('justNow') : t('minutesAgo', { count: session.ago })}
              </span>
              <span className={styles.duration}>{session.duration}</span>
              <span className={styles.path}>{session.path}</span>
              <Meta
                flag={session.flag}
                browser={session.browser}
                os={session.os}
                device={'device' in session ? session.device : undefined}
              />
              {'errors' in session && (
                <span className={styles.bug}>
                  <Bug aria-hidden />
                  {session.errors}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
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
const ERROR_AT = 75;

function Jump({ t }: { t: Scenes }) {
  return (
    <div className={styles.compose}>
      <div className={styles.player}>
        <div className={styles.playerTop}>
          <span>
            {t('start')} <b>/</b>
          </span>
          <Meta flag='DK' browser='chrome' os='apple' />
        </div>
        <div className={styles.playerView}>
          <CheckoutMock masked className={styles.zoomedSmall} />
        </div>
        <div className={styles.strip} style={vars({ '--at': ERROR_AT / 100 })}>
          {TICKS.map(([at, kind]) => (
            <i key={at} data-kind={kind} style={vars({ '--x': at / 100 })} />
          ))}
          <span className={styles.tip}>{t('clientError')} · 1:41</span>
          <span className={styles.playhead} />
        </div>
        <div className={styles.controls}>
          <Play aria-hidden />
          <span className={styles.clock}>1:41 / 2:14</span>
          <span className={styles.toggle}>
            <i />
            {t('skip')}
          </span>
          <b>8×</b>
        </div>
      </div>
      <span className={styles.watch}>
        <Play aria-hidden />
        {t('watchReplay')}
      </span>
    </div>
  );
}

const EVENTS = [
  { at: '1:32', key: 'input' },
  { at: '1:38', key: 'click' },
  { at: '1:41', key: 'clientError' },
  { at: '1:43', key: 'click' },
] as const;

function Why({ t }: { t: Scenes }) {
  return (
    <div className={`${styles.compose} ${styles.wide}`}>
      <div className={styles.whyPage}>
        <CheckoutMock
          masked
          flagPostcode
          adorn={{
            postcode: (
              <span className={styles.note} data-note='empty'>
                {t('emptyField')}
              </span>
            ),
            pay: (
              <>
                <span className={styles.clicks} aria-hidden>
                  <i />
                  <i />
                  <span className={styles.cursor}>
                    <CursorGlyph />
                  </span>
                </span>
                <span className={styles.note} data-note='clicks'>
                  {t('clicks', { count: 2 })}
                </span>
              </>
            ),
          }}
        />
      </div>
      <div className={`${styles.card} ${styles.events}`}>
        <p className={styles.cardHead}>{t('timeline')}</p>
        <ul>
          {EVENTS.map(({ at, key }, i) => (
            <li key={at} data-kind={key} style={vars({ '--i': i })}>
              <time>{at}</time>
              <i />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SCENES = [
  { Scene: Recording, glow: undefined },
  { Scene: Thrown, glow: 'down' },
  { Scene: Ready, glow: undefined },
  { Scene: Jump, glow: 'down' },
  { Scene: Why, glow: 'warn' },
] as const;

export function ReplayScenes({ step }: { step: number }) {
  const t = useTranslations('landing.replay.story.scenes');
  return (
    <div className={styles.scenes}>
      {SCENES.map(({ Scene, glow }, i) => (
        <div key={i} className={styles.scene} data-active={i === step || undefined} data-glow={glow}>
          <Scene t={t} />
        </div>
      ))}
    </div>
  );
}
