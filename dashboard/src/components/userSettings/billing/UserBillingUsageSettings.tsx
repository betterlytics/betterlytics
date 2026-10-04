'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageRow, type UsageSegment } from '@/components/billing/UsageRow';
import { useUsageBreakdown } from '@/hooks/useUsageBreakdown';
import { useToggle } from '@/hooks/use-toggle';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import type { BillableEventType, UsageData } from '@/entities/billing/billing.entities';
import UserSettingsSection from '../shared/UserSettingsSection';

const SITE_SEGMENT_COUNT = 5;

const SEGMENT_COLORS = [
  'var(--usage-segment-1)',
  'var(--usage-segment-2)',
  'var(--usage-segment-3)',
  'var(--usage-segment-4)',
  'var(--usage-segment-5)',
];
const OTHER_COLOR = 'var(--usage-segment-other)';
const OTHER_KEY = '__other__';

const EVENT_TYPE_LABEL_KEYS = {
  pageview: 'eventTypes.pageview',
  custom: 'eventTypes.custom',
  cwv: 'eventTypes.cwv',
  outbound_link: 'eventTypes.outbound_link',
  client_error: 'eventTypes.client_error',
} as const satisfies Record<BillableEventType, string>;

type LegendEntry = {
  key: string;
  label: string;
  total: number;
  percentageOfLimit: number;
  color: string;
};

function LegendRow({ entry }: { entry: LegendEntry }) {
  const locale = useLocale();

  return (
    <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3'>
      <span className='size-2 shrink-0 rounded-[2px]' style={{ background: entry.color }} aria-hidden='true' />
      <span className='truncate text-sm'>{entry.label}</span>
      <span className='text-right text-xs whitespace-nowrap tabular-nums'>
        {formatNumber(entry.total, locale)}{' '}
        <span className='text-muted-foreground'>({formatPercentage(entry.percentageOfLimit, locale)})</span>
      </span>
    </div>
  );
}

function LegendList({ entries }: { entries: LegendEntry[] }) {
  return (
    <div className='flex flex-col gap-2.5'>
      {entries.map((entry) => (
        <LegendRow key={entry.key} entry={entry} />
      ))}
    </div>
  );
}

export default function UserBillingUsageSettings({ usage }: { usage: UsageData }) {
  const t = useTranslations('components.userSettings.billing.usage');
  const tb = useTranslations('components.userSettings.billing.usage.breakdown');
  const locale = useLocale();

  const [dimension, setDimension] = useState<'type' | 'site'>('type');
  const { isOn: showAllSites, toggle: toggleAllSites } = useToggle();
  const { breakdown, isLoading, error } = useUsageBreakdown();

  const typeEntries: LegendEntry[] = (breakdown?.byEventType ?? []).map((row, index) => {
    const labelKey = EVENT_TYPE_LABEL_KEYS[row.eventType as BillableEventType];
    return {
      key: row.eventType,
      label: labelKey ? tb(labelKey) : row.eventType,
      total: row.total,
      percentageOfLimit: row.percentageOfLimit,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    };
  });

  const allSites = breakdown?.bySite ?? [];
  const topSiteEntries: LegendEntry[] = allSites.slice(0, SITE_SEGMENT_COUNT).map((row, index) => ({
    key: row.siteId,
    label: row.domain,
    total: row.total,
    percentageOfLimit: row.percentageOfLimit,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
  }));
  const tailSiteEntries: LegendEntry[] = allSites.slice(SITE_SEGMENT_COUNT).map((row) => ({
    key: row.siteId,
    label: row.domain,
    total: row.total,
    percentageOfLimit: row.percentageOfLimit,
    color: OTHER_COLOR,
  }));

  const otherEntry: LegendEntry | null =
    tailSiteEntries.length > 0
      ? {
          key: OTHER_KEY,
          label: tb('otherSites', { count: tailSiteEntries.length }),
          total: tailSiteEntries.reduce((sum, entry) => sum + entry.total, 0),
          percentageOfLimit: tailSiteEntries.reduce((sum, entry) => sum + entry.percentageOfLimit, 0),
          color: OTHER_COLOR,
        }
      : null;

  const hasBreakdown = Boolean(breakdown) && (breakdown?.total ?? 0) > 0;
  const hasSiteDimension = allSites.length > 1;
  const showingSites = dimension === 'site' && hasSiteDimension;

  // At most SITE_SEGMENT_COUNT + 1 segments, however long the tail.
  const segmentSource = showingSites ? [...topSiteEntries, ...(otherEntry ? [otherEntry] : [])] : typeEntries;
  const segments: UsageSegment[] = segmentSource.map((entry) => ({
    key: entry.key,
    label: entry.label,
    value: `${formatNumber(entry.total, locale)} (${formatPercentage(entry.percentageOfLimit, locale)})`,
    percentageOfLimit: entry.percentageOfLimit,
    color: entry.color,
  }));

  const siteLegend = showAllSites
    ? [...topSiteEntries, ...tailSiteEntries]
    : [...topSiteEntries, ...(otherEntry ? [otherEntry] : [])];

  const meter = (
    <UsageRow
      percentageOfLimit={usage.usagePercentage}
      segments={hasBreakdown ? segments : undefined}
      valueClassName={usage.isOverLimit ? 'text-destructive font-medium' : undefined}
      label={
        <div className='space-y-1'>
          <div className='text-sm font-medium'>{t('eventsLabel')}</div>
          <p className='text-muted-foreground text-xs'>{t('resetsInDays', { days: usage.daysUntilReset })}</p>
        </div>
      }
      value={t.rich('eventsUsed', {
        current: formatNumber(usage.current, locale),
        limit: formatNumber(usage.limit, locale),
        percentage: formatPercentage(usage.usagePercentage, locale),
        muted: (chunks) => <span className='text-muted-foreground'>{chunks}</span>,
      })}
    />
  );

  const note = (
    <div className='bg-muted/40 text-muted-foreground mt-2 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs'>
      <Info className='mt-px size-3.5 shrink-0' aria-hidden='true' />
      <span>{tb('nonBillableNote')}</span>
    </div>
  );

  const showMoreButton = tailSiteEntries.length > 0 && (
    <button
      type='button'
      onClick={toggleAllSites}
      className='text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 -ml-1.5 cursor-pointer self-start rounded-md px-1.5 py-1 text-xs font-medium focus-visible:ring-[3px] focus-visible:outline-none'
    >
      {showAllSites ? tb('showFewerSites') : tb('showAllSites', { count: tailSiteEntries.length })}
    </button>
  );

  if (isLoading || error || !hasBreakdown) {
    return (
      <UserSettingsSection title={t('title')}>
        <div className='flex flex-col gap-4'>
          {meter}
          {isLoading ? (
            <div className='flex flex-col gap-2.5'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
            </div>
          ) : (
            <p className='text-muted-foreground text-xs'>{error ? tb('loadError') : tb('empty')}</p>
          )}
        </div>
      </UserSettingsSection>
    );
  }

  if (!hasSiteDimension) {
    return (
      <UserSettingsSection title={t('title')}>
        <div className='flex flex-col gap-4'>
          {meter}
          <LegendList entries={typeEntries} />
          {note}
        </div>
      </UserSettingsSection>
    );
  }

  return (
    <Tabs
      value={dimension}
      onValueChange={(value) => setDimension(value as 'type' | 'site')}
      className='pb-10 last:pb-0'
    >
      <UserSettingsSection
        title={t('title')}
        headerAction={
          <TabsList className='h-8'>
            <TabsTrigger value='type' className='cursor-pointer text-xs'>
              {tb('byType')}
            </TabsTrigger>
            <TabsTrigger value='site' className='cursor-pointer text-xs'>
              {tb('bySite')}
            </TabsTrigger>
          </TabsList>
        }
      >
        <div className='flex flex-col gap-4'>
          {meter}
          <TabsContent value='type'>
            <LegendList entries={typeEntries} />
          </TabsContent>
          <TabsContent value='site'>
            <div className='flex flex-col gap-2.5'>
              <LegendList entries={siteLegend} />
              {showMoreButton}
            </div>
          </TabsContent>
          {note}
        </div>
      </UserSettingsSection>
    </Tabs>
  );
}
