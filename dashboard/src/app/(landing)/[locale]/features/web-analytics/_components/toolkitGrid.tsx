import { Filter, Mail, Monitor, Plus, Smartphone, Tablet } from 'lucide-react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FeatureGrid } from '@/landing/components/feature/featureGrid';
import grid from '@/landing/components/feature/featureGrid.module.css';
import { FLAGS } from '@/landing/components/illustrations/flags';
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
        <path d='M64,40 C94,40 94,70 124,70' />
        <path d='M206,70 C222,70 222,100 238,100' data-lit />
        <path d='M64,40 C98,40 98,116 132,116' data-quiet />
        <path d='M206,70 C222,70 222,30 238,30' data-quiet />
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
        {DEVICES.map(({ key, icon: Icon, share }) => (
          <span key={key} className={styles.device} style={vars({ '--share': share / 100 })}>
            <Icon strokeWidth={1.75} />
            <span>{t(`devices.${key}`)}</span>
            <i />
            <b>{share}%</b>
          </span>
        ))}
        <span className={styles.browsers}>
          {BROWSERS.map((browser) => (
            <Image key={browser} src={`/browser-icons/${browser}.svg`} alt='' width={14} height={14} />
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
      <span className={cn(grid.card, styles.count)} data-lit>
        <span>signup</span>
        <b>690</b>
      </span>
    </div>
  );
}

function Reports({ t }: { t: Art }) {
  return (
    <div className={cn(grid.comp, styles.reports)}>
      <div className={cn(grid.card, styles.mail)}>
        <span className={styles.from}>
          <Mail strokeWidth={1.75} />
          Betterlytics
          <small>{t('reports.when')}</small>
        </span>
        <b className={styles.subject}>{t('reports.subject')}</b>
        <span className={styles.figures}>
          <span>
            {t('reports.visitors')} <b>12,480</b>
          </span>
          <span data-up>+8%</span>
        </span>
        <svg className={styles.spark} viewBox='0 0 120 24' preserveAspectRatio='none' aria-hidden>
          <path d='M0,18 L17,15 L34,17 L51,11 L68,13 L85,8 L102,9 L120,4' />
        </svg>
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
      return <Reports t={art} />;
  }
}

const KEYS: Key[] = ['journeys', 'filters', 'locations', 'devices', 'events', 'reports'];

export function ToolkitGrid() {
  const t = useTranslations('landing.analytics.toolkit');
  const art = useTranslations('landing.analytics.toolkit.art');
  return (
    <FeatureGrid
      items={KEYS.map((key) => ({
        key,
        title: t(`items.${key}.title`),
        body: t(`items.${key}.body`),
        scene: scene(key, art),
      }))}
    />
  );
}
