import type { ComponentType } from 'react';
import { Bell, Check, ChevronDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Stage } from '@/landing/components/feature/showcase';
import { Corners } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import { vars } from '@/landing/lib/cssVars';
import styles from './checksGrid.module.css';

type Key = 'http' | 'keyword' | 'ssl' | 'threshold' | 'latency' | 'reasons';
type Art = ReturnType<typeof useTranslations<'landing.uptime.checks.art'>>;

/* Values are mock data, left literal; labels are copy. Each scene is a fixed 300×140 composition. */

function CheckBadge({ className }: { className?: string }) {
  return (
    <span className={`${styles.badge} ${className ?? ''}`}>
      <Check strokeWidth={3} />
    </span>
  );
}

function Request({ t }: { t: Art }) {
  return (
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.reqCard}`}>
        <div className={styles.reqHead}>
          <span>{t('request')}</span>
          <span className={styles.select}>
            GET
            <ChevronDown />
          </span>
        </div>
        <b className={styles.path}>/health</b>
        {[
          { label: t('headers'), value: 0.6 },
          { label: t('timeout'), value: 0.33 },
        ].map(({ label, value }, i) => (
          <span key={label} className={styles.slider} style={vars({ '--v': value, '--i': i })}>
            <span>{label}</span>
            <i>
              <i />
            </i>
          </span>
        ))}
      </div>
      <i className={styles.reqWire} />
      <span className={styles.okChip}>
        <i />
        200 OK
      </span>
    </div>
  );
}

const SKELETON = [46, 40, 46, 32];

function Keyword() {
  return (
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.browser}`}>
        <div className={styles.lights}>
          <i />
          <i />
          <i />
        </div>
        <p className={styles.status}>HTTP/1.1 200 OK</p>
        <div className={styles.skeleton}>
          {SKELETON.map((w, i) => (
            <i key={i} style={vars({ '--w': `${w}px` })} />
          ))}
          <i style={vars({ '--w': '14px' })} />
        </div>
      </div>
      <span className={styles.keyword}>
        <i />
        “Add to cart”
      </span>
      <CheckBadge className={styles.keywordBadge} />
    </div>
  );
}

function Certificate() {
  return (
    <div className={`${styles.comp} ${styles.certComp}`}>
      <svg className={styles.shield} viewBox='0 0 80 92' fill='none'>
        <defs>
          <linearGradient id='checks-shield' x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0' stopColor='#929be6' />
            <stop offset='1' stopColor='#4f5cc9' />
          </linearGradient>
          <linearGradient id='checks-lock' x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0' stopColor='#cdd1ee' />
            <stop offset='1' stopColor='#9097c9' />
          </linearGradient>
        </defs>
        <path
          className={styles.shieldOuter}
          d='M40 3 6 15v24c0 23 14 40 34 50 20-10 34-27 34-50V15L40 3Z'
          stroke='url(#checks-shield)'
          strokeWidth='3.4'
          strokeLinejoin='round'
          pathLength={1}
        />
        <path
          d='M40 11.5 13.5 21V40c0 18 10.8 31.5 26.5 40C55.7 71.5 66.5 58 66.5 40V21L40 11.5Z'
          fill='rgb(26 43 209 / 0.1)'
          stroke='rgb(139 151 255 / 0.3)'
          strokeWidth='1.2'
          strokeLinejoin='round'
        />
        <path d='M32.5 43v-5.5a7.5 7.5 0 0 1 15 0V43' stroke='#b9bee3' strokeWidth='3.6' />
        <rect x='27' y='42' width='26' height='20' rx='3.5' fill='url(#checks-lock)' stroke='#6c75c8' />
        <circle cx='40' cy='50' r='2.8' fill='#1c2250' />
        <path d='M40 51.5v4.5' stroke='#1c2250' strokeWidth='2.4' strokeLinecap='round' />
      </svg>
      <div className={styles.certText}>
        <b>docs.acme.com</b>
        <span>Let&apos;s Encrypt</span>
        <i style={vars({ '--w': '130px' })} />
        <i style={vars({ '--w': '100px' })} />
        <svg className={styles.signature} viewBox='0 0 60 18' fill='none'>
          <path
            d='M2 13c4-1 6-9 9-9 2 0-3 12 0 11 3-1 4-7 6-7s-1 5 1 5 4-4 6-4 1 3 3 3 6-1 9-2 7 0 9 0'
            stroke='currentColor'
            strokeWidth='1.2'
            strokeLinecap='round'
            strokeLinejoin='round'
            pathLength={1}
          />
        </svg>
      </div>
      <CheckBadge className={styles.certBadge} />
    </div>
  );
}

const TILES = ['ok', 'warn', 'ok', 'ok'] as const;

/** Filled, unlike lucide's outline triangle. */
function WarnGlyph() {
  return (
    <svg viewBox='0 0 16 16' fill='none'>
      <path d='M8 1.9 14.8 13.6H1.2L8 1.9Z' fill='#f4b53f' stroke='#f4b53f' strokeLinejoin='round' />
      <path d='M8 6.2v3.4' stroke='#3a2908' strokeWidth='1.7' strokeLinecap='round' />
      <circle cx='8' cy='11.5' r='0.95' fill='#3a2908' />
    </svg>
  );
}

function Threshold() {
  return (
    <div className={`${styles.comp} ${styles.tilesComp}`}>
      <div className={styles.tiles}>
        {TILES.map((state, i) => (
          <span key={i} className={styles.tile} data-state={state} style={vars({ '--i': i })}>
            {state === 'ok' ? <Check strokeWidth={2.6} /> : <WarnGlyph />}
          </span>
        ))}
        <span className={styles.failGroup}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.tile} data-state='fail' style={vars({ '--i': TILES.length + i })}>
              <X strokeWidth={2.6} />
            </span>
          ))}
        </span>
        <i className={styles.arrow} />
        <span className={styles.tile} data-state='bell' style={vars({ '--i': TILES.length + 4 })}>
          <Bell strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

/* today's response time, and yesterday's dotted under it; y runs down a 240×80 box */
const TODAY = [62, 58, 50, 55, 44, 50, 36, 30, 34, 18, 20, 5];
const YESTERDAY = [75, 71, 73, 63, 67, 57, 61, 49, 53, 43, 45, 29];

function path(series: number[]) {
  const step = 240 / (series.length - 1);
  return series.map((y, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${y}`).join(' ');
}

function Latency({ t }: { t: Art }) {
  const line = path(TODAY);
  return (
    <div className={`${styles.comp} ${styles.chartComp}`}>
      <div className={styles.chartHead}>
        <span>{t('response')}</span>
        <span>{t('lastDay')}</span>
      </div>
      <b className={styles.chartFigure}>
        182<small>ms</small>
      </b>
      <div className={styles.plot}>
        <svg className={styles.chart} viewBox='0 0 240 80' preserveAspectRatio='none'>
          <defs>
            <linearGradient id='checks-area' x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0' stopColor='#3a4bd8' stopOpacity='0.55' />
              <stop offset='1' stopColor='#1a2bd1' stopOpacity='0' />
            </linearGradient>
          </defs>
          <path className={styles.area} d={`${line} L240 80 L0 80 Z`} />
          <path className={styles.yesterday} d={path(YESTERDAY)} />
          <path className={styles.today} d={line} pathLength={1} />
        </svg>
        {/* the line's last point, drawn in HTML so the stretched SVG can't squash it */}
        <i className={styles.chartEnd} style={vars({ '--y': TODAY.at(-1)! / 80 })} />
      </div>
    </div>
  );
}

function Reasons({ t }: { t: Art }) {
  const rows = [
    { label: t('reason5xx'), count: 2, tone: 'down' },
    { label: t('reasonTimeout'), count: 1, tone: 'warn' },
    { label: t('reasonSsl'), count: 1, tone: 'volt' },
  ];
  return (
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.list}`}>
        {rows.map((row, i) => (
          <span key={row.label} className={styles.reason} data-lit={i === 0 || undefined}>
            <i data-tone={row.tone} />
            {row.label}
            <b>{row.count}</b>
          </span>
        ))}
      </div>
      <svg className={styles.listWire} viewBox='0 0 34 30' fill='none'>
        <path d='M0 2h10c6 0 8 4 8 9v8c0 5 3 9 9 9h7' pathLength={1} />
      </svg>
      <div className={`${styles.card} ${styles.detail}`}>
        {[54, 40, 46, 30].map((w, i) => (
          <i key={i} style={vars({ '--w': `${w}px` })} />
        ))}
      </div>
    </div>
  );
}

const SCENES: Record<Key, ComponentType<{ t: Art }>> = {
  http: Request,
  keyword: Keyword,
  ssl: Certificate,
  threshold: Threshold,
  latency: Latency,
  reasons: Reasons,
};

const KEYS = Object.keys(SCENES) as Key[];

export function ChecksGrid() {
  const t = useTranslations('landing.uptime.checks');
  const art = useTranslations('landing.uptime.checks.art');
  return (
    <ul className={styles.grid}>
      {KEYS.map((key, i) => {
        const Scene = SCENES[key];
        return (
          <li key={key} className={styles.cell}>
            <Corners />
            <Stage className={key === 'ssl' ? `${styles.stage} ${styles.litStage}` : styles.stage}>
              <Scene t={art} />
            </Stage>
            <Reveal index={i % 3} className={styles.copy}>
              <h3 className='text-title leading-6 font-medium tracking-ui'>{t(`items.${key}.title`)}</h3>
              <p className='mt-2 text-label leading-[22px] text-muted'>{t(`items.${key}.body`)}</p>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
