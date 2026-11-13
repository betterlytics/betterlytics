import { Filter, Monitor, Plus, Smartphone, Tablet } from 'lucide-react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FeatureGrid } from '@/landing/components/feature/featureGrid';
import grid from '@/landing/components/feature/featureGrid.module.css';
import { FLAGS } from '@/landing/components/illustrations/flags';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './toolkitGrid.module.css';

type Key = 'journeys' | 'filters' | 'locations' | 'devices' | 'events' | 'reports';
type Art = ReturnType<typeof useTranslations<'landing.analytics.toolkit.art'>>;

/* Values are mock data, left literal; labels are copy. */

const PATH = ['/', '/pricing', '/signup'];

function Journeys() {
  return (
    <div className={cn(grid.comp, styles.journeys)}>
      <svg className={styles.paths} viewBox='0 0 300 140' aria-hidden>
        <path d='M64,40 C98,40 98,116 132,116' pathLength={1} data-quiet />
        <path d='M206,70 C222,70 222,30 238,30' pathLength={1} data-quiet />
        <path d='M64,40 C94,40 94,70 124,70' pathLength={1} data-step={0} />
        <path d='M206,70 C222,70 222,100 238,100' pathLength={1} data-step={1} data-lit />
      </svg>
      {PATH.map((page, i) => (
        <span key={page} className={cn(grid.card, styles.page)} data-step={i} data-lit={i === 2 || undefined}>
          {page}
        </span>
      ))}
      <span className={cn(grid.card, styles.page)} data-step='branch'>
        /blog
      </span>
      <span className={cn(grid.card, styles.page)} data-step='exit'>
        /docs
      </span>
    </div>
  );
}

const FILTERS = [
  { key: 'country', value: 'Germany' },
  { key: 'device', value: 'Mobile' },
  { key: 'campaign', value: 'launch-week' },
] as const;

function Filters({ t }: { t: Art }) {
  return (
    <div className={cn(grid.comp, styles.filters)}>
      {FILTERS.map(({ key, value }, i) => (
        <span
          key={key}
          className={cn(grid.card, styles.filter)}
          data-lit={i === 2 || undefined}
          style={vars({ '--i': i })}
        >
          <Filter strokeWidth={1.75} />
          {t(`filters.${key}`)} <b>{value}</b>
        </span>
      ))}
      <span className={cn(grid.card, styles.add)}>
        <Plus strokeWidth={1.75} />
        {t('filters.add')}
      </span>
    </div>
  );
}

function Locations() {
  return (
    <div className={cn(grid.comp, styles.locations)}>
      <span className={cn(grid.card, styles.place)} data-level='country'>
        <FLAGS.DE className={styles.flag} />
        Germany
      </span>
      <i className={styles.step} data-level='region' />
      <span className={cn(grid.card, styles.place)} data-level='region'>
        Bavaria
      </span>
      <i className={styles.step} data-level='city' />
      <span className={cn(grid.card, styles.place)} data-level='city' data-lit>
        Munich
        <b>1,284</b>
      </span>
    </div>
  );
}

const DEVICES = [
  { key: 'desktop', icon: Monitor, share: 58 },
  { key: 'mobile', icon: Smartphone, share: 37 },
  { key: 'tablet', icon: Tablet, share: 5 },
] as const;

const BROWSERS = ['chrome', 'safari', 'firefox', 'edge'];

function Devices({ t }: { t: Art }) {
  return (
    <div className={cn(grid.comp, styles.devices)}>
      <div className={cn(grid.card, styles.deviceCard)}>
        {DEVICES.map(({ key, icon: Icon, share }, i) => (
          <span key={key} className={styles.device} style={vars({ '--share': share / 100, '--i': i })}>
            <Icon strokeWidth={1.75} />
            <span>{t(`devices.${key}`)}</span>
            <i />
            <b>{share}%</b>
          </span>
        ))}
        <span className={styles.browsers}>
          {BROWSERS.map((browser, i) => (
            <Image
              key={browser}
              src={`/browser-icons/${browser}.svg`}
              alt=''
              width={14}
              height={14}
              style={vars({ '--i': i })}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function Events() {
  return (
    <div className={cn(grid.comp, styles.events)}>
      <code className={cn(grid.card, styles.call)}>
        <span>betterlytics.event(</span>
        <span>
          <s>&apos;signup&apos;</s>, {'{'} plan: <s>&apos;team&apos;</s> {'}'})
        </span>
      </code>
      <svg className={styles.send} viewBox='0 0 300 140' aria-hidden>
        <path d='M120,78 C120,104 150,108 176,108' pathLength={1} />
      </svg>
      <span className={cn(grid.card, styles.count)} data-lit>
        <span>signup</span>
        <b />
      </span>
    </div>
  );
}

/* The report email is English-only, so the sheet's labels stay literal too. */
const METRICS = [
  { label: 'Visitors', value: '12,480', change: 8 },
  { label: 'Page Views', value: '31,902', change: 5 },
  { label: 'Sessions', value: '14,211', change: 6 },
];

const PAGES = [
  ['/', '4,120'],
  ['/pricing', '2,980'],
  ['/blog/cookieless-analytics', '1,240'],
];

function Reports() {
  return (
    <div className={cn(grid.comp, styles.reports)}>
      <div className={cn(grid.card, styles.sheet)}>
        <span className={styles.sheetHead}>
          <BrandMark className={styles.mark} />
          Weekly Analytics Report
        </span>
        <span className={styles.sheetMeta}>acme.com · Nov 3 – Nov 9</span>
        <span className={styles.metrics}>
          {METRICS.map(({ label, value, change }, i) => (
            <span key={label} className={styles.metric} style={vars({ '--i': i })}>
              <small>{label}</small>
              <b>{value}</b>
              <em>↑ {change}%</em>
            </span>
          ))}
        </span>
        <span className={styles.tableTitle}>Top Pages</span>
        {PAGES.map(([path, views], i) => (
          <span key={path} className={styles.row} style={vars({ '--i': i })}>
            <i>{i + 1}.</i>
            <span>{path}</span>
            <b>{views}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function scene(key: Key, art: Art): ReactNode {
  switch (key) {
    case 'journeys':
      return <Journeys />;
    case 'filters':
      return <Filters t={art} />;
    case 'locations':
      return <Locations />;
    case 'devices':
      return <Devices t={art} />;
    case 'events':
      return <Events />;
    case 'reports':
      return <Reports />;
  }
}

const KEYS: Key[] = ['journeys', 'filters', 'locations', 'devices', 'events', 'reports'];

export function ToolkitGrid() {
  const t = useTranslations('landing.analytics.toolkit');
  const art = useTranslations('landing.analytics.toolkit.art');
  return (
    <FeatureGrid
      stageClassName={styles.stage}
      items={KEYS.map((key) => ({
        key,
        title: t(`items.${key}.title`),
        body: t(`items.${key}.body`),
        scene: scene(key, art),
      }))}
    />
  );
}
