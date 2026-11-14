'use client';

import {
  useCallback,
  useId,
  useRef,
  useState,
  type AnimationEventHandler,
  type FocusEvent,
  type PointerEvent,
} from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  CORE_WEB_VITAL_LEVELS,
  type CoreWebVitalLevel,
  formatCWV,
  getCoreWebVitalLevel,
} from '@/utils/coreWebVitals';
import { FLAGS } from '@/landing/components/illustrations/flags';
import { Corners } from '@/landing/components/ui/frame';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { useDismiss } from '@/landing/hooks/useDismiss';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import {
  BREAKDOWN,
  OVERALL,
  type Dimension,
  type RowIcon,
} from '@/landing/features/core-web-vitals/_components/vitalsData';
import { MAP_ANCHORS, MAP_COLS, MAP_COUNTRIES, MAP_ROWS, MAP_RUNS } from './mapGrid';
import styles from './loadMap.module.css';

type CountryKey = (typeof MAP_COUNTRIES)[number];

const VISITORS_MS = OVERALL.LCP!;
const VISITORS_LEVEL = getCoreWebVitalLevel('LCP', VISITORS_MS)!;

const DIMENSIONS: Dimension[] = ['countries', 'pages', 'devices', 'browsers', 'os'];

/** The columns phones show: the far Pacific goes at both ends, Alaska to New Zealand, so the rest draws larger. */
const PHONE_COLS = [22, 168] as const;

/** Diagonals two cells apart; the corner pieces keep each line whole across tiles. */
const SLASH = 'M-0.5 0.5L0.5 -0.5M0 2L2 0M1.5 2.5L2.5 1.5';

/**
 * The map's runs of land, read once: path data per kind of cell (other land, then MAP_COUNTRIES), one line per run
 * in a row, hatched through a pattern; and each country's cells, to land page loads on.
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

/** Made-up page loads that land on the map one at a time, named as the breakdown's rows: the city, the visitor's device, OS and browser, the page, its LCP. */
const LOADS: {
  country: CountryKey;
  city: [lat: number, lng: number];
  device: string;
  os: string;
  browser: string;
  page: string;
  ms: number;
}[] = [
  {
    country: 'US',
    city: [40.7, -74.0],
    device: 'mobile',
    os: 'iOS',
    browser: 'Safari',
    page: '/checkout',
    ms: 3100,
  },
  {
    country: 'IN',
    city: [19.1, 72.9],
    device: 'mobile',
    os: 'Android',
    browser: 'Chrome',
    page: '/shop/espresso-beans',
    ms: 5200,
  },
  {
    country: 'DE',
    city: [52.5, 13.4],
    device: 'desktop',
    os: 'Windows',
    browser: 'Edge',
    page: '/subscriptions',
    ms: 1600,
  },
  {
    country: 'BR',
    city: [-23.5, -46.6],
    device: 'mobile',
    os: 'Android',
    browser: 'Samsung Internet',
    page: '/',
    ms: 3400,
  },
  {
    country: 'GB',
    city: [51.5, -0.1],
    device: 'desktop',
    os: 'macOS',
    browser: 'Safari',
    page: '/blog/brewing-guide',
    ms: 2100,
  },
  { country: 'JP', city: [35.7, 139.7], device: 'mobile', os: 'iOS', browser: 'Safari', page: '/about', ms: 1900 },
  { country: 'US', city: [37.8, -122.4], device: 'desktop', os: 'macOS', browser: 'Chrome', page: '/', ms: 1200 },
  {
    country: 'IN',
    city: [13.0, 77.6],
    device: 'mobile',
    os: 'Android',
    browser: 'Chrome',
    page: '/checkout',
    ms: 4300,
  },
  {
    country: 'DE',
    city: [48.1, 11.6],
    device: 'desktop',
    os: 'Linux',
    browser: 'Firefox',
    page: '/blog/brewing-guide',
    ms: 2200,
  },
  {
    country: 'BR',
    city: [-8.1, -34.9],
    device: 'mobile',
    os: 'Android',
    browser: 'Chrome',
    page: '/shop/espresso-beans',
    ms: 4600,
  },
  {
    country: 'GB',
    city: [53.5, -2.2],
    device: 'desktop',
    os: 'Windows',
    browser: 'Chrome',
    page: '/checkout',
    ms: 2700,
  },
  {
    country: 'JP',
    city: [34.7, 135.5],
    device: 'tablet',
    os: 'Android',
    browser: 'Chrome',
    page: '/shop/espresso-beans',
    ms: 3200,
  },
];
/**
 * The grid runs 2° a cell from 76°N and 180°W, so a city lands in its cell, or its country's nearest one. Each box
 * wanders its own way, turning by the golden angle from one load to the next.
 */
const ARRIVALS = LOADS.map((load, i) => {
  const [lat, lng] = load.city;
  const [col, row] = [Math.floor((lng + 180) / 2), Math.floor((76 - lat) / 2)];
  const far = ([c, r]: [number, number]) => (c - col) ** 2 + (r - row) ** 2;
  const [c, r] = CELLS[load.country].reduce((best, cell) => (far(cell) < far(best) ? cell : best));
  const x = (c + 0.5) / MAP_COLS;
  const y = (r + 0.5) / MAP_ROWS;
  const align: 'start' | 'center' | 'end' = x < 0.2 ? 'start' : x > 0.8 ? 'end' : 'center';
  const heading = i * 2.39996;
  const [wx, wy] = [Math.cos(heading), Math.sin(heading)].map((n) => Math.round(n * 1000) / 1000);
  return { ...load, x, y, below: y < 0.36, align, wx, wy };
});
type Arrival = (typeof ARRIVALS)[number];

/** Shown together and still, far apart, when the reader asks for reduced motion. */
const STILL = [0, 1, 3];

/** Each dimension's rows by LCP, fastest first, and their icons by name for the loads. */
const TABLES = Object.fromEntries(
  DIMENSIONS.map((dimension) => [
    dimension,
    BREAKDOWN[dimension]
      .map((row) => ({ key: row.key, lcp: row.p75.LCP!, icon: row.icon }))
      .sort((a, b) => a.lcp - b.lcp),
  ]),
) as Record<Dimension, { key: string; lcp: number; icon?: RowIcon }[]>;

/** One scale across the tabs: the slowest row's bar fills its room. */
const SLOWEST = Math.max(...DIMENSIONS.flatMap((dimension) => TABLES[dimension].map((row) => row.lcp)));

const ICONS = Object.fromEntries(
  DIMENSIONS.map((dimension) => [
    dimension,
    Object.fromEntries(BREAKDOWN[dimension].map((row) => [row.key, row.icon])),
  ]),
) as Record<Dimension, Record<string, RowIcon | undefined>>;

const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

/** Hairlines across the map through a country, stopping short of its main landmass. */
const LOCATORS = Object.fromEntries(
  MAP_COUNTRIES.map((key) => {
    const [x, y, w, h] = MAP_ANCHORS[key];
    const [gx, gy] = [w + 1.5, h + 1.5];
    return [key, `M0 ${y}H${x - gx}M${x + gx} ${y}H${MAP_COLS}M${x} 0V${y - gy}M${x} ${y + gy}V${MAP_ROWS}`];
  }),
) as Record<CountryKey, string>;

const LEVEL_OF = Object.fromEntries(
  TABLES.countries.map((row) => [row.key, getCoreWebVitalLevel('LCP', row.lcp)!]),
) as Record<CountryKey, CoreWebVitalLevel>;

function useFormats() {
  const locale = useLocale();
  const seconds = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'narrow',
    maximumFractionDigits: 2,
  });
  const regions = new Intl.DisplayNames([locale], { type: 'region' });
  return {
    s: (ms: number) => seconds.format(ms / 1000),
    country: (key: string) => regions.of(key) ?? key,
  };
}

/** A row's LCP as a bar in its level's colour, with the time at its end. */
function Meter({ ms, text, index }: { ms: number; text: string; index: number }) {
  const t = useTranslations('landing.vitals.field');
  const level = getCoreWebVitalLevel('LCP', ms);
  return (
    <td data-level={level}>
      <span className={styles.meter}>
        <i style={vars({ '--length': ms / SLOWEST, '--i': index })} />
        {text}
        {level && <span className='sr-only'>, {t(`levels.${level}`)}</span>}
      </span>
    </td>
  );
}

function Head({ first }: { first: string }) {
  const t = useTranslations('landing.vitals.field');
  return (
    <thead>
      <tr>
        <th scope='col'>
          <span className='sr-only'>{first}</span>
        </th>
        <th scope='col'>
          <span className='sr-only'>{t('columns.lcp')}</span>
        </th>
      </tr>
    </thead>
  );
}

function Glyph({ icon }: { icon?: RowIcon }) {
  switch (icon?.kind) {
    case 'device': {
      const Icon = DEVICE_ICONS[icon.device];
      return <Icon className={cn(styles.glyph, styles.device)} aria-hidden />;
    }
    case 'flag': {
      const Flag = FLAGS[icon.code];
      return <Flag className={styles.flag} aria-hidden />;
    }
    case 'image':
      return <Image src={icon.src} alt='' width={14} height={14} className={styles.glyph} />;
    case 'mask':
      return (
        <i
          className={cn(styles.glyph, styles.mask)}
          style={{ WebkitMaskImage: `url(${icon.src})`, maskImage: `url(${icon.src})` }}
          aria-hidden
        />
      );
    default:
      return null;
  }
}

/** A page load landing: its dot, a ring that spreads once, and a box on a stem with what it was and how long it took. */
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
      style={vars({ '--x': arrival.x, '--y': arrival.y, '--wx': arrival.wx, '--wy': arrival.wy })}
      onAnimationEnd={onAnimationEnd}
    >
      <i className={styles.ping} />
      <span className={styles.lead}>
        <i className={styles.stem} />
        <span className={styles.callout}>
          <Corners persistent className='[--corner-fill:var(--color-canvas)]' />
          <span className={styles.visit}>
            <Glyph icon={ICONS.devices[arrival.device]} />
            <Glyph icon={ICONS.os[arrival.os]} />
            <Glyph icon={ICONS.browsers[arrival.browser]} />
            <b>{arrival.page}</b>
          </span>
          <span className={styles.reading}>
            {t('columns.lcp')} <b>{formatCWV('LCP', arrival.ms, locale)}</b>
          </span>
        </span>
      </span>
    </span>
  );
}

export function LoadMap() {
  const t = useTranslations('landing.vitals.field');
  const { s, country } = useFormats();
  const landings = useRef<HTMLSpanElement>(null);
  const onScreen = useInView(landings, 'onScreen');
  const [landing, setLanding] = useState(0);
  const patterns = useId().replace(/[^\w-]/g, '');
  const tabs = useId();
  const [tab, setTab] = useState<Dimension>('countries');
  const [hover, setHover] = useState<CountryKey | null>(null);
  const [focus, setFocus] = useState<CountryKey | null>(null);
  const [pinned, setPinned] = useState<CountryKey | null>(null);
  const unpin = useCallback(() => setPinned(null), []);
  useDismiss(pinned !== null, '[data-pin]', unpin);
  const panels = useRef<HTMLDivElement>(null);
  const counted = useInView(panels);
  const active = hover ?? focus ?? pinned;
  /** Landings play while the map is on screen and wait while the reader looks at a country. */
  const playing = onScreen && active === null;
  const live = ARRIVALS[landing];

  const paint = (kind: string) => `url(#${patterns}-${kind})`;
  const label = (dimension: Dimension, key: string) => {
    if (dimension === 'countries') return country(key);
    if (dimension === 'devices') return t(`devices.${key as 'desktop' | 'mobile' | 'tablet'}`);
    return key;
  };
  const choose = (dimension: Dimension) => {
    setTab(dimension);
    setHover(null);
    setFocus(null);
    setPinned(null);
  };
  const pin = (key: CountryKey) => {
    setTab('countries');
    setPinned((current) => (current === key ? null : key));
  };
  const pointer = (key: CountryKey) => ({
    onPointerEnter: (event: PointerEvent) => event.pointerType !== 'touch' && setHover(key),
    onPointerLeave: () => setHover(null),
  });
  const onFocus = (key: CountryKey) => (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.matches(':focus-visible')) setFocus(key);
  };

  return (
    <div className={cn(levels.levels, styles.root)} data-nosnippet>
      <div className={styles.layout}>
        <figure className={styles.atlas}>
          <div
            className={styles.map}
            style={vars({
              '--cols': MAP_COLS,
              '--rows': MAP_ROWS,
              '--phone-from': PHONE_COLS[0],
              '--phone-cols': PHONE_COLS[1] - PHONE_COLS[0],
            })}
          >
            <svg
              className={styles.svg}
              viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`}
              preserveAspectRatio='xMinYMid slice'
              data-active={active ?? undefined}
              aria-hidden
            >
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
              <g className={styles.world}>
                {MAP_COUNTRIES.map((key) => (
                  <path
                    key={key}
                    className={styles.locator}
                    d={LOCATORS[key]}
                    data-on={active === key || undefined}
                  />
                ))}
                <path className={styles.land} d={PATHS[0]} stroke={paint('land')} />
                {MAP_COUNTRIES.map((key, i) => (
                  <g
                    key={key}
                    className={styles.country}
                    data-level={LEVEL_OF[key]}
                    data-on={active === key || undefined}
                  >
                    <path className={styles.land} d={PATHS[i + 1]} stroke={paint(LEVEL_OF[key])} />
                    <path
                      className={styles.hit}
                      d={PATHS[i + 1]}
                      data-pin={key}
                      onClick={() => pin(key)}
                      {...pointer(key)}
                    />
                  </g>
                ))}
              </g>
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
          <figcaption className={styles.key}>
            {CORE_WEB_VITAL_LEVELS.map((level) => (
              <span key={level} data-level={level}>
                {t(`levels.${level}`)}
              </span>
            ))}
          </figcaption>
        </figure>

        <div className={styles.ledger}>
          <p className={styles.us} data-level={VISITORS_LEVEL}>
            <span className={styles.name}>{t('visitors')}</span>
            <span className={styles.figure}>
              {t('columns.lcp')} <b>{s(VISITORS_MS)}</b>
              <span className='sr-only'>, {t(`levels.${VISITORS_LEVEL}`)}</span>
            </span>
          </p>

          <div className={styles.breakdown}>
            <div
              role='tablist'
              aria-label={t('split')}
              className={styles.tabs}
              onKeyDown={rovingTabKeys(DIMENSIONS.indexOf(tab), DIMENSIONS.length, (i) => choose(DIMENSIONS[i]))}
            >
              {DIMENSIONS.map((dimension) => (
                <button
                  key={dimension}
                  type='button'
                  role='tab'
                  id={`${tabs}-tab-${dimension}`}
                  aria-controls={`${tabs}-panel-${dimension}`}
                  aria-selected={dimension === tab}
                  tabIndex={dimension === tab ? 0 : -1}
                  onClick={() => choose(dimension)}
                >
                  {t(`tabs.${dimension}`)}
                </button>
              ))}
            </div>
            <div ref={panels} className={styles.panels} data-in={counted || undefined}>
              {DIMENSIONS.map((dimension) => (
                <div
                  key={dimension}
                  role='tabpanel'
                  id={`${tabs}-panel-${dimension}`}
                  aria-labelledby={`${tabs}-tab-${dimension}`}
                  className={styles.panel}
                  data-shown={dimension === tab || undefined}
                >
                  <table className={styles.table}>
                    <Head first={t(`columns.${dimension}`)} />
                    <tbody>
                      {TABLES[dimension].map((row, index) => {
                        if (dimension !== 'countries') {
                          return (
                            <tr key={row.key}>
                              <th scope='row'>
                                <span className={styles.row}>
                                  <Glyph icon={row.icon} />
                                  <span>{label(dimension, row.key)}</span>
                                </span>
                              </th>
                              <Meter ms={row.lcp} text={s(row.lcp)} index={index} />
                            </tr>
                          );
                        }
                        const key = row.key as CountryKey;
                        return (
                          <tr
                            key={key}
                            data-on={active === key || undefined}
                            data-pin={key}
                            onClick={() => pin(key)}
                            {...pointer(key)}
                          >
                            <th scope='row'>
                              <button
                                type='button'
                                className={styles.row}
                                aria-pressed={pinned === key}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  pin(key);
                                }}
                                onFocus={onFocus(key)}
                                onBlur={() => setFocus(null)}
                              >
                                <Glyph icon={row.icon} />
                                <span>{label(dimension, key)}</span>
                              </button>
                            </th>
                            <Meter ms={row.lcp} text={s(row.lcp)} index={index} />
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
