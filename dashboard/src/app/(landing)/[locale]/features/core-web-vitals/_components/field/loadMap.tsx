'use client';

import { useId, useRef, useState, type AnimationEventHandler, type FocusEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import {
  CORE_WEB_VITAL_LEVELS,
  type CoreWebVitalLevel,
  formatCWV,
  getCoreWebVitalLevel,
} from '@/utils/coreWebVitals';
import { Corners } from '@/landing/components/ui/frame';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
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

/**
 * The map's runs of land, read once: path data per kind of cell (other land, then MAP_COUNTRIES), one line per run
 * in a row, dotted in CSS; and each country's cells, to land page loads on.
 */
const { PATHS, CELLS } = (() => {
  const paths = Array.from({ length: MAP_COUNTRIES.length + 1 }, () => '');
  const cells = Object.fromEntries(MAP_COUNTRIES.map((key) => [key, [] as [number, number][]])) as Record<
    CountryKey,
    [col: number, row: number][]
  >;
  let cell = 0;
  for (const [, letter, digits] of MAP_RUNS.matchAll(/([a-h])(\d*)/g)) {
    const kind = 'abcdefgh'.indexOf(letter) - 1;
    let left = digits ? Number(digits) : 1;
    while (left > 0) {
      const col = cell % MAP_COLS;
      const row = Math.floor(cell / MAP_COLS);
      const run = Math.min(left, MAP_COLS - col);
      if (kind >= 0) paths[kind] += `M${col} ${row + 0.5}h${run}`;
      if (kind >= 1) for (let i = 0; i < run; i++) cells[MAP_COUNTRIES[kind - 1]].push([col + i, row]);
      cell += run;
      left -= run;
    }
  }
  return { PATHS: paths, CELLS: cells };
})();

type Os = 'apple' | 'windows' | 'android' | 'linux';
type Browser = 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsunginternet';

/** Made-up page loads that land on the map one at a time: the city, the visitor's OS and browser, the page, its LCP. */
const LOADS: {
  country: CountryKey;
  city: [lat: number, lng: number];
  os: Os;
  browser: Browser;
  page: string;
  ms: number;
}[] = [
  { country: 'US', city: [40.7, -74.0], os: 'apple', browser: 'safari', page: '/checkout', ms: 3100 },
  { country: 'IN', city: [19.1, 72.9], os: 'android', browser: 'chrome', page: '/shop/espresso-beans', ms: 5200 },
  { country: 'DE', city: [52.5, 13.4], os: 'windows', browser: 'edge', page: '/subscriptions', ms: 1600 },
  { country: 'BR', city: [-23.5, -46.6], os: 'android', browser: 'samsunginternet', page: '/', ms: 3400 },
  { country: 'GB', city: [51.5, -0.1], os: 'apple', browser: 'safari', page: '/blog/brewing-guide', ms: 2100 },
  { country: 'JP', city: [35.7, 139.7], os: 'apple', browser: 'safari', page: '/about', ms: 1900 },
  { country: 'US', city: [37.8, -122.4], os: 'apple', browser: 'chrome', page: '/', ms: 1200 },
  { country: 'IN', city: [13.0, 77.6], os: 'android', browser: 'chrome', page: '/checkout', ms: 4300 },
  { country: 'DE', city: [48.1, 11.6], os: 'linux', browser: 'firefox', page: '/blog/brewing-guide', ms: 2200 },
  { country: 'BR', city: [-8.1, -34.9], os: 'android', browser: 'chrome', page: '/shop/espresso-beans', ms: 4600 },
  { country: 'GB', city: [53.5, -2.2], os: 'windows', browser: 'chrome', page: '/checkout', ms: 2700 },
  { country: 'JP', city: [34.7, 135.5], os: 'android', browser: 'chrome', page: '/shop/espresso-beans', ms: 3200 },
];

/** The grid runs 2° a cell from 76°N and 180°W, so a city lands in its cell, or its country's nearest one. */
const ARRIVALS = LOADS.map((load) => {
  const [lat, lng] = load.city;
  const [col, row] = [Math.floor((lng + 180) / 2), Math.floor((76 - lat) / 2)];
  const far = ([c, r]: [number, number]) => (c - col) ** 2 + (r - row) ** 2;
  const [c, r] = CELLS[load.country].reduce((best, cell) => (far(cell) < far(best) ? cell : best));
  const x = (c + 0.5) / MAP_COLS;
  const y = (r + 0.5) / MAP_ROWS;
  const align: 'start' | 'center' | 'end' = x < 0.2 ? 'start' : x > 0.8 ? 'end' : 'center';
  return { ...load, x, y, below: y < 0.36, align };
});
type Arrival = (typeof ARRIVALS)[number];

/** Shown together and still, far apart, when the reader asks for reduced motion. */
const STILL = [0, 1, 3];

const OS_ICONS: Record<Os, { src: string; mask: boolean }> = {
  apple: { src: '/os-icons/apple-dark.svg', mask: true },
  windows: { src: '/os-icons/windows.svg', mask: true },
  android: { src: '/os-icons/android.svg', mask: false },
  linux: { src: '/os-icons/linux.svg', mask: false },
};

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

function Glyph({ src, mask }: { src: string; mask: boolean }) {
  return mask ? (
    <i className={styles.mask} style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }} />
  ) : (
    <Image src={src} alt='' width={13} height={13} className={styles.glyph} />
  );
}

/** A page load landing: its dot, a ring that spreads once, and a box with what it was and how long it took. */
function Landing({
  arrival,
  live = false,
  onAnimationEnd,
}: {
  arrival: Arrival;
  live?: boolean;
  onAnimationEnd?: AnimationEventHandler<HTMLSpanElement>;
}) {
  const t = useTranslations('landing.vitals.field');
  const locale = useLocale();
  return (
    <span
      className={styles.arrival}
      data-live={live || undefined}
      data-level={getCoreWebVitalLevel('LCP', arrival.ms)}
      data-below={arrival.below || undefined}
      data-align={arrival.align}
      style={vars({ '--x': arrival.x, '--y': arrival.y })}
      onAnimationEnd={onAnimationEnd}
    >
      <i className={styles.ping} />
      <span className={styles.callout}>
        <Corners
          persistent
          className='[--corner-edge:var(--color-volt-lift)] [--corner-fill:var(--color-canvas)]'
        />
        <span className={styles.visit}>
          <Glyph {...OS_ICONS[arrival.os]} />
          <Glyph src={`/browser-icons/${arrival.browser}.svg`} mask={false} />
          <b>{arrival.page}</b>
        </span>
        <span className={styles.reading}>
          {t('columns.lcp')} <b>{formatCWV('LCP', arrival.ms, locale)}</b>
        </span>
      </span>
    </span>
  );
}

export function LoadMap() {
  const t = useTranslations('landing.vitals.field');
  const { s, count, share, country } = useFormats();
  const landings = useRef<HTMLSpanElement>(null);
  const onScreen = useInView(landings, 'onScreen');
  const [landing, setLanding] = useState(0);
  const hatched = useReviewVariant('map') === 'hatch';
  const patterns = useId().replace(/[^\w-]/g, '');
  const [hover, setHover] = useState<CountryKey | null>(null);
  const [focus, setFocus] = useState<CountryKey | null>(null);
  const [pinned, setPinned] = useState<CountryKey | null>(null);
  const active = hover ?? focus ?? pinned;
  /** Landings play while the map is on screen and wait while the reader looks at a country. */
  const playing = onScreen && active === null;
  const live = ARRIVALS[landing];

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
          <div className={styles.map}>
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
                <path
                  key={key}
                  className={styles.locator}
                  d={LOCATORS[key]}
                  data-on={active === key || undefined}
                />
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
            <span ref={landings} className={styles.landings} data-paused={!playing || undefined} aria-hidden>
              <Landing
                key={landing}
                arrival={live}
                live
                onAnimationEnd={(event) => {
                  if (event.target === event.currentTarget) setLanding((index) => (index + 1) % ARRIVALS.length);
                }}
              />
              <span className={styles.still}>
                {STILL.map((index) => (
                  <Landing key={index} arrival={ARRIVALS[index]} />
                ))}
              </span>
            </span>
          </div>
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
                    data-live={(playing && live.country === row.key) || undefined}
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
