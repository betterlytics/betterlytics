'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { LIFT_STEP_S, LiftSwap } from '@/landing/components/ui/liftSwap';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import type { IllustrationProps } from './types';
import styles from './traffic.module.css';

/* Mock data, kept literal on purpose; the product's own labels are translated. */

const TABS = [
  {
    key: 'all',
    pages: [
      { path: '/pricing', count: 8412, share: 100 },
      { path: '/blog/cookieless-analytics', count: 6203, share: 74 },
      { path: '/', count: 5118, share: 61 },
      { path: '/docs/installation', count: 3940, share: 47 },
      { path: '/changelog', count: 2106, share: 25 },
    ],
  },
  {
    key: 'entry',
    pages: [
      { path: '/', count: 4870, share: 100 },
      { path: '/blog/cookieless-analytics', count: 4312, share: 89 },
      { path: '/blog/ga4-alternatives', count: 2245, share: 46 },
      { path: '/pricing', count: 1904, share: 39 },
      { path: '/docs/installation', count: 702, share: 14 },
    ],
  },
  {
    key: 'exit',
    pages: [
      { path: '/pricing', count: 3318, share: 100 },
      { path: '/docs/installation', count: 2474, share: 75 },
      { path: '/blog/cookieless-analytics', count: 1652, share: 50 },
      { path: '/signup/welcome', count: 1127, share: 34 },
      { path: '/changelog', count: 811, share: 24 },
    ],
  },
] as const;

/** % of readers reaching each quarter of the page. */
const DEPTH = [100, 72, 48, 21];
const AVG_DEPTH = 58;

/** Monday first; 2024-01-01 was a Monday. */
const weekdays = (locale: string) =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(Date.UTC(2024, 0, 1 + i)),
  );
const HOURS = 24;

/** 0 to 1; deterministic rather than random so server and client render the same. */
function intensity(day: number, hour: number) {
  const weekend = day >= 5;
  const office = Math.exp(-((hour - 11) ** 2) / 14);
  const evening = Math.exp(-((hour - 20) ** 2) / 6) * 0.45;
  const night = hour < 6 ? 0.04 : 0;
  const base = (weekend ? 0.45 : 1) * Math.max(office, evening) + night;
  const wobble = 0.08 * Math.sin(day * 2.3 + hour * 1.7);
  return Math.min(1, Math.max(0.03, base + wobble - (day === 4 && hour > 14 ? 0.18 : 0)));
}

export function Traffic({ entered }: IllustrationProps) {
  const t = useTranslations('landing.illustrations.traffic');
  const locale = useLocale();
  const count = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });
  const days = weekdays(locale);
  // `from`: the previous tab, null until the first switch
  const [{ tab, from }, setView] = useState<{ tab: number; from: number | null }>({ tab: 0, from: null });
  const direction = from === null || tab > from ? 1 : -1;
  const switched = from !== null;

  const id = useId();
  const tabId = (i: number) => `${id}-tab-${i}`;
  const panelId = `${id}-panel`;

  const pick = (next: number) => {
    if (next !== tab) setView({ tab: next, from: tab });
  };

  return (
    <div className={styles.traffic} data-in={entered || undefined}>
      <div className={cn(styles.card, styles.pages)}>
        <div className={styles.head}>
          <p className={styles.title}>{t('topPages')}</p>
          <div
            className={styles.tabs}
            role='tablist'
            aria-label={t('tabs')}
            style={vars({ '--i': tab })}
            onKeyDown={rovingTabKeys(tab, TABS.length, pick)}
          >
            {TABS.map((item, i) => (
              <button
                key={item.key}
                type='button'
                role='tab'
                id={tabId(i)}
                aria-selected={i === tab}
                aria-controls={panelId}
                tabIndex={i === tab ? 0 : -1}
                className={styles.tab}
                onClick={() => pick(i)}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>
        {/* index keys keep the rows in place; the bars resize and LiftSwap swaps the text */}
        <div className={styles.body} id={panelId} role='tabpanel' aria-labelledby={tabId(tab)}>
          {TABS[tab].pages.map((page, i) => (
            <div key={i} className={styles.row}>
              <span
                className={styles.bar}
                style={vars({
                  '--share': page.share / 100,
                  '--d': switched ? `${i * LIFT_STEP_S}s` : `${0.25 + i * 0.07}s`,
                })}
              />
              <LiftSwap
                as='span'
                className={styles.path}
                id={page.path}
                direction={direction}
                delay={i * LIFT_STEP_S}
              >
                {page.path}
              </LiftSwap>
              <LiftSwap
                as='span'
                className={styles.count}
                id={count.format(page.count)}
                direction={direction}
                delay={i * LIFT_STEP_S}
              >
                {count.format(page.count)}
              </LiftSwap>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(styles.card, styles.depth)}>
        <div className={styles.head}>
          <p className={styles.title}>{t('scrollDepth')}</p>
        </div>
        <div className={styles.body}>
          <p className={styles.url}>/blog/cookieless-analytics</p>
          <div className={styles.page}>
            <div className={styles.chrome} aria-hidden>
              <i />
              <i />
              <i />
            </div>
            <div className={styles.read} aria-hidden>
              {DEPTH.map((reach, i) => (
                <span key={i} style={vars({ '--reach': reach / 100, '--d': `${0.5 + i * 0.16}s` })} />
              ))}
            </div>
            <ol className={styles.marks} aria-label={t('depthMarks')}>
              {DEPTH.map((reach, i) => (
                <li key={i} style={vars({ '--quarter': i })}>
                  {percent.format(reach / 100)}
                </li>
              ))}
            </ol>
          </div>
          <p className={styles.avg}>
            {t('avgDepth')} <span>{percent.format(AVG_DEPTH / 100)}</span>
          </p>
        </div>
      </div>

      <div className={cn(styles.card, styles.week)}>
        <div className={styles.head}>
          <p className={styles.title}>{t('weekly')}</p>
          <span className={styles.caption}>{t('byHour')}</span>
        </div>
        <div className={cn(styles.body, styles.heatmap)} role='img' aria-label={t('alt')}>
          <div className={styles.days} aria-hidden>
            {days.map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div className={styles.grid} aria-hidden>
            {days.map((_, day) =>
              Array.from({ length: HOURS }, (_, hour) => (
                <i
                  key={`${day}-${hour}`}
                  style={vars({
                    '--v': intensity(day, hour).toFixed(2),
                    '--d': `${0.45 + (day + hour) * 0.012}s`,
                  })}
                />
              )),
            )}
          </div>
          <div className={styles.hours} aria-hidden>
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
          </div>
        </div>
      </div>
    </div>
  );
}
