'use client';

import { useId, useState, type FocusEvent, type PointerEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { CORE_WEB_VITAL_LEVELS, type CoreWebVitalLevel, getCoreWebVitalLevel } from '@/utils/coreWebVitals';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { cn } from '@/landing/lib/cn';
import { useReviewVariant } from '@/landing/features/core-web-vitals/_components/review/reviewDock';
import { BREAKDOWN, OVERALL } from '@/landing/features/core-web-vitals/_components/vitalsData';
import { MAP_ANCHORS, MAP_COLS, MAP_COUNTRIES, MAP_ROWS, MAP_RUNS } from './mapDots';
import styles from './loadMap.module.css';

type CountryKey = (typeof MAP_COUNTRIES)[number];

/** The made-up site's page loads and their 75th percentile, as in the breakdown explorer. */
const PAGE_LOADS = 3000;
const VISITORS_MS = OVERALL.LCP!;
/** Think with Google's mobile speed benchmarks; the 1s to 3s figure is in its chart. Only the ca-en edition still serves it. */
const SOURCE_URL =
  'https://business.google.com/ca-en/think/marketing-strategies/mobile-page-speed-new-industry-benchmarks/';

const [GOOD_MS, FAIR_MS] = CWV_THRESHOLDS.LCP;

/** Diagonals two cells apart, for the hatched style; the corner pieces keep each line whole across tiles. */
const SLASH = 'M-0.5 0.5L0.5 -0.5M0 2L2 0M1.5 2.5L2.5 1.5';

/** Path data per kind of cell (other land, then MAP_COUNTRIES): one line per run of land in a row, dotted in CSS. */
const PATHS: string[] = (() => {
  const kinds = Array.from({ length: MAP_COUNTRIES.length + 1 }, () => '');
  let cell = 0;
  for (const [, letter, digits] of MAP_RUNS.matchAll(/([a-h])(\d*)/g)) {
    const kind = 'abcdefgh'.indexOf(letter) - 1;
    let left = digits ? Number(digits) : 1;
    while (left > 0) {
      const col = cell % MAP_COLS;
      const run = Math.min(left, MAP_COLS - col);
      if (kind >= 0) kinds[kind] += `M${col} ${Math.floor(cell / MAP_COLS) + 0.5}h${run}`;
      cell += run;
      left -= run;
    }
  }
  return kinds;
})();

/** Hairlines across the map through a country, stopping short of its main landmass. */
const LOCATORS = Object.fromEntries(
  MAP_COUNTRIES.map((key) => {
    const [x, y, w, h] = MAP_ANCHORS[key];
    const [gx, gy] = [w + 1.5, h + 1.5];
    return [key, `M0 ${y}H${x - gx}M${x + gx} ${y}H${MAP_COLS}M${x} 0V${y - gy}M${x} ${y + gy}V${MAP_ROWS}`];
  }),
) as Record<CountryKey, string>;

const ROWS = BREAKDOWN.countries
  .map((row) => ({ key: row.key as CountryKey, share: row.share, lcp: row.p75.LCP! }))
  .sort((a, b) => a.lcp - b.lcp);

const LEVEL_OF = Object.fromEntries(ROWS.map((row) => [row.key, getCoreWebVitalLevel('LCP', row.lcp)!])) as Record<
  CountryKey,
  CoreWebVitalLevel
>;

function useFormats() {
  const locale = useLocale();
  const seconds = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'narrow',
    maximumFractionDigits: 2,
  });
  const count = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });
  const regions = new Intl.DisplayNames([locale], { type: 'region' });
  return {
    s: (ms: number) => seconds.format(ms / 1000),
    count: (n: number) => count.format(n),
    share: (n: number) => percent.format(n),
    country: (key: string) => regions.of(key) ?? key,
  };
}

function Lcp({ ms, text }: { ms: number; text: string }) {
  const t = useTranslations('landing.vitals.field');
  const level = getCoreWebVitalLevel('LCP', ms);
  return (
    <td data-level={level}>
      {text}
      {level && <span className='sr-only'>, {t(`levels.${level}`)}</span>}
    </td>
  );
}

function Head({ first }: { first?: string }) {
  const t = useTranslations('landing.vitals.field');
  return (
    <thead>
      <tr>
        {first ? (
          <th scope='col'>
            <span>{first}</span>
          </th>
        ) : (
          <td />
        )}
        <th scope='col'>
          <span>{t('columns.loads')}</span>
        </th>
        <th scope='col'>
          <span>{t('columns.lcp')}</span>
        </th>
      </tr>
    </thead>
  );
}

export function LoadMap() {
  const t = useTranslations('landing.vitals.field');
  const { s, count, share, country } = useFormats();
  const hatched = useReviewVariant('map') === 'hatch';
  const patterns = useId().replace(/[^\w-]/g, '');
  const [hover, setHover] = useState<CountryKey | null>(null);
  const [focus, setFocus] = useState<CountryKey | null>(null);
  const [pinned, setPinned] = useState<CountryKey | null>(null);
  const active = hover ?? focus ?? pinned;

  const paint = (kind: string) => (hatched ? `url(#${patterns}-${kind})` : undefined);
  const pin = (key: CountryKey) => setPinned((current) => (current === key ? null : key));
  const pointer = (key: CountryKey) => ({
    onPointerEnter: (event: PointerEvent) => event.pointerType !== 'touch' && setHover(key),
    onPointerLeave: () => setHover(null),
  });
  const onFocus = (key: CountryKey) => (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.matches(':focus-visible')) setFocus(key);
  };

  return (
    <div className={cn(levels.levels, styles.root)}>
      <div className={styles.layout}>
        <figure className={styles.atlas} data-style={hatched ? 'hatch' : undefined}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`}
            style={{ aspectRatio: `${MAP_COLS} / ${MAP_ROWS}` }}
            data-active={active ?? undefined}
            aria-hidden
          >
            {hatched && (
              <defs>
                <pattern id={`${patterns}-land`} width='2' height='2' patternUnits='userSpaceOnUse'>
                  <path className={styles.slashLand} d={SLASH} />
                </pattern>
                {CORE_WEB_VITAL_LEVELS.map((level) => (
                  <pattern
                    key={level}
                    id={`${patterns}-${level}`}
                    data-level={level}
                    width='2'
                    height='2'
                    patternUnits='userSpaceOnUse'
                  >
                    <path className={styles.slash} d={SLASH} />
                  </pattern>
                ))}
              </defs>
            )}
            {MAP_COUNTRIES.map((key) => (
              <path key={key} className={styles.locator} d={LOCATORS[key]} data-on={active === key || undefined} />
            ))}
            <path className={hatched ? styles.hatched : styles.land} d={PATHS[0]} stroke={paint('land')} />
            {MAP_COUNTRIES.map((key, i) => (
              <g
                key={key}
                className={styles.country}
                data-level={LEVEL_OF[key]}
                data-on={active === key || undefined}
              >
                <path
                  className={hatched ? styles.hatched : styles.dots}
                  d={PATHS[i + 1]}
                  stroke={paint(LEVEL_OF[key])}
                />
                <path className={styles.hit} d={PATHS[i + 1]} onClick={() => pin(key)} {...pointer(key)} />
              </g>
            ))}
          </svg>
          <figcaption className={styles.foot}>
            <span className={styles.key}>
              <span data-level='good'>{t('key.good', { value: s(GOOD_MS) })}</span>
              <span data-level='fair'>{t('key.fair', { value: s(FAIR_MS) })}</span>
              <span data-level='poor'>{t('key.poor', { value: s(FAIR_MS) })}</span>
            </span>
            <span className={styles.source}>
              {t.rich('source', {
                link: (chunks) => (
                  <a href={SOURCE_URL} target='_blank' rel='noopener noreferrer'>
                    {chunks}
                  </a>
                ),
              })}
            </span>
          </figcaption>
        </figure>

        <div className={styles.ledger}>
          <div className={styles.us}>
            <table className={styles.table}>
              <caption className='sr-only'>{t('summary')}</caption>
              <Head />
              <tbody>
                <tr>
                  <th scope='row'>
                    <span className={styles.name}>{t('visitors.name')}</span>
                    <span className={styles.note}>{t('visitors.note')}</span>
                  </th>
                  <td>{count(PAGE_LOADS)}</td>
                  <Lcp ms={VISITORS_MS} text={s(VISITORS_MS)} />
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.countries}>
            <table className={styles.table}>
              <caption className='sr-only'>{t('byCountry')}</caption>
              <Head first={t('columns.country')} />
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.key}
                    data-on={active === row.key || undefined}
                    onClick={() => pin(row.key)}
                    {...pointer(row.key)}
                  >
                    <th scope='row'>
                      <button
                        type='button'
                        aria-pressed={pinned === row.key}
                        onClick={(event) => {
                          event.stopPropagation();
                          pin(row.key);
                        }}
                        onFocus={onFocus(row.key)}
                        onBlur={() => setFocus(null)}
                      >
                        {country(row.key)}
                      </button>
                    </th>
                    <td>{share(row.share)}</td>
                    <Lcp ms={row.lcp} text={s(row.lcp)} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
