'use client';

import { useId, useState } from 'react';
import { NumberFlowGroup } from '@number-flow/react';
import { Monitor, Smartphone, Tablet, X } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { getGaugeBox } from '@/components/gauge';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { PERCENTILE_KEYS, formatCWV, getCoreWebVitalLevel, type PercentileKey } from '@/utils/coreWebVitals';
import { FLAGS } from '@/landing/components/illustrations/flags';
import { VitalGauge } from '@/landing/components/ui/vitalGauge';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import { ScoreBadge } from './scoreBadge';
import {
  BREAKDOWN,
  OVERALL,
  atPercentile,
  scoreRow,
  within,
  type BreakdownRow,
  type Dimension,
  type RowIcon,
} from './vitalsData';
import styles from './breakdownExplorer.module.css';

const DIMENSIONS: Dimension[] = ['pages', 'devices', 'countries', 'browsers', 'os'];
const METRICS: CoreWebVitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
const DEVICE_ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };
const GAUGE = { size: 112, strokeWidth: 6, arcGap: 2.5 };
const BOX = getGaugeBox(GAUGE);

type Filter = { dimension: Dimension; key: string };

function RowGlyph({ icon }: { icon?: RowIcon }) {
  if (!icon) return null;
  switch (icon.kind) {
    case 'device': {
      const Icon = DEVICE_ICONS[icon.device];
      return <Icon className='size-3.5 text-muted' aria-hidden />;
    }
    case 'flag': {
      const Flag = FLAGS[icon.code];
      return <Flag className='h-[10px] w-[15px] flex-none rounded-[1.5px] ring-1 ring-white/8' aria-hidden />;
    }
    case 'image':
      return <Image src={icon.src} alt='' width={14} height={14} className='size-3.5 flex-none' />;
    case 'mask':
      return (
        <i
          className={styles.mask}
          style={{ WebkitMaskImage: `url(${icon.src})`, maskImage: `url(${icon.src})` }}
          aria-hidden
        />
      );
  }
}

export function BreakdownExplorer() {
  const t = useTranslations('landing.vitals.breakdown');
  const locale = useLocale();
  const id = useId();
  const [tab, setTab] = useState<Dimension>('pages');
  const [percentile, setPercentile] = useState<PercentileKey>('p75');
  const [filter, setFilter] = useState<Filter | null>(null);

  const regions = new Intl.DisplayNames([locale], { type: 'region' });
  const label = (dimension: Dimension, key: string) => {
    if (dimension === 'devices') return t(`devices.${key as 'desktop' | 'mobile' | 'tablet'}`);
    if (dimension === 'countries') return regions.of(key) ?? key;
    return key;
  };
  const decimal = (digits: number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const selected = filter && BREAKDOWN[filter.dimension].find((row) => row.key === filter.key);
  const gauges = selected ? selected.p75 : OVERALL;
  const select = (row: BreakdownRow) =>
    setFilter((current) =>
      current?.dimension === tab && current.key === row.key ? null : { dimension: tab, key: row.key },
    );
  const tabIndex = DIMENSIONS.indexOf(tab);

  return (
    <div className={cn(levels.levels, styles.stage)}>
      <div className={styles.window}>
        <div className={styles.head}>
          <b>{t('card')}</b>
          <span className={styles.scope} aria-live='polite'>
            {filter ? (
              <span className={styles.chip}>
                {t('filter', {
                  dimension: t(`columns.${filter.dimension}`),
                  value: label(filter.dimension, filter.key),
                })}
                <button type='button' onClick={() => setFilter(null)} aria-label={t('clear')}>
                  <X className='size-3' strokeWidth={2.4} />
                </button>
              </span>
            ) : (
              t('scope')
            )}
          </span>
        </div>

        <NumberFlowGroup>
          <div
            className={styles.gauges}
            style={vars({ '--box-w': `${BOX.width}px`, '--box-h': `${BOX.height}px` })}
          >
            {METRICS.map((metric) => (
              <div key={metric} className={styles.slot}>
                <VitalGauge metric={metric} value={gauges[metric]} {...GAUGE} />
              </div>
            ))}
          </div>
        </NumberFlowGroup>

        <div className={styles.toolbar}>
          <div
            role='tablist'
            aria-label={t('card')}
            className={styles.tabs}
            onKeyDown={rovingTabKeys(tabIndex, DIMENSIONS.length, (i) => setTab(DIMENSIONS[i]))}
          >
            {DIMENSIONS.map((dimension) => (
              <button
                key={dimension}
                type='button'
                role='tab'
                id={`${id}-tab-${dimension}`}
                aria-controls={`${id}-panel`}
                aria-selected={dimension === tab}
                tabIndex={dimension === tab ? 0 : -1}
                onClick={() => setTab(dimension)}
              >
                {t(`tabs.${dimension}`)}
              </button>
            ))}
          </div>
          <div className={styles.percentiles} role='group' aria-label={t('percentile')}>
            {PERCENTILE_KEYS.map((key) => (
              <button
                key={key}
                type='button'
                aria-pressed={key === percentile}
                onClick={() => setPercentile(key)}
                data-percentile={key}
              >
                <i aria-hidden />
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div role='tabpanel' id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope='col'>{t(`columns.${tab}`)}</th>
                {METRICS.map((metric) => (
                  <th key={metric} scope='col' data-col={metric}>
                    {metric}
                  </th>
                ))}
                <th scope='col' data-col='performance'>
                  {t('columns.performance')}
                </th>
                <th scope='col' data-col='opportunity'>
                  {t('columns.opportunity')}
                </th>
              </tr>
            </thead>
            <tbody>
              {BREAKDOWN[tab].map((original) => {
                const row =
                  selected && filter?.dimension !== tab
                    ? { ...original, p75: within(original.p75, selected.p75) }
                    : original;
                const values = atPercentile(row.p75, percentile);
                const { score, opportunity } = scoreRow(row, percentile);
                const isSelected = filter?.dimension === tab && filter.key === row.key;
                return (
                  <tr key={row.key} data-selected={isSelected || undefined} onClick={() => select(row)}>
                    <th scope='row'>
                      <button
                        type='button'
                        aria-pressed={isSelected}
                        onClick={(event) => {
                          event.stopPropagation();
                          select(row);
                        }}
                      >
                        <RowGlyph icon={row.icon} />
                        <span>{label(tab, row.key)}</span>
                      </button>
                    </th>
                    {METRICS.map((metric) => (
                      <td key={metric} data-col={metric} data-level={getCoreWebVitalLevel(metric, values[metric])}>
                        {formatCWV(metric, values[metric], locale)}
                      </td>
                    ))}
                    <td data-col='performance'>
                      <ScoreBadge score={score} />
                    </td>
                    <td data-col='opportunity'>{decimal(2).format(opportunity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className={styles.hint}>{t('hint')}</p>
    </div>
  );
}
