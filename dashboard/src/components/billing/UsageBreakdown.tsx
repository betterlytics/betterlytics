'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsageBreakdown } from '@/hooks/useUsageBreakdown';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import type {
  BillableEventType,
  UsageBreakdown as UsageBreakdownData,
} from '@/entities/billing/billing.entities';

const SITE_PREVIEW_COUNT = 5;

/**
 * Shared by the headline usage row so both land in the same columns — the child bars
 * only read as a decomposition of the total while they share its track.
 */
export const USAGE_ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(110px,20rem)_7.5rem]';

const EVENT_TYPE_LABEL_KEYS = {
  pageview: 'eventTypes.pageview',
  custom: 'eventTypes.custom',
  cwv: 'eventTypes.cwv',
  outbound_link: 'eventTypes.outbound_link',
  client_error: 'eventTypes.client_error',
} as const satisfies Record<BillableEventType, string>;

type BreakdownRowProps = {
  label: string;
  total: number;
  percentageOfLimit: number;
};

function BreakdownRow({ label, total, percentageOfLimit }: BreakdownRowProps) {
  const locale = useLocale();

  return (
    <div className={USAGE_ROW_GRID}>
      <span className='truncate text-sm'>{label}</span>
      <Progress
        value={Math.min(percentageOfLimit, 100)}
        color='var(--primary)'
        className='order-last col-span-2 h-1.5 md:order-none md:col-span-1'
      />
      <span className='text-muted-foreground text-right text-xs whitespace-nowrap tabular-nums'>
        {formatNumber(total, locale)} ({formatPercentage(percentageOfLimit, locale)})
      </span>
    </div>
  );
}

function BreakdownRows({ breakdown }: { breakdown: UsageBreakdownData }) {
  const t = useTranslations('components.userSettings.billing.usage.breakdown');
  const [showAllSites, setShowAllSites] = useState(false);

  const hasMultipleSites = breakdown.bySite.length > 1;
  const visibleSites = showAllSites ? breakdown.bySite : breakdown.bySite.slice(0, SITE_PREVIEW_COUNT);
  const hiddenSiteCount = breakdown.bySite.length - visibleSites.length;

  const eventTypeRows = (
    <div className='flex flex-col gap-2.5'>
      {breakdown.byEventType.map((row) => {
        const labelKey = EVENT_TYPE_LABEL_KEYS[row.eventType as BillableEventType];
        return (
          <BreakdownRow
            key={row.eventType}
            label={labelKey ? t(labelKey) : row.eventType}
            total={row.total}
            percentageOfLimit={row.percentageOfLimit}
          />
        );
      })}
    </div>
  );

  return (
    <div className='flex flex-col gap-3.5'>
      {hasMultipleSites ? (
        <Tabs defaultValue='type' className='gap-3.5'>
          <TabsList className='h-8'>
            <TabsTrigger value='type' className='cursor-pointer text-xs'>
              {t('byType')}
            </TabsTrigger>
            <TabsTrigger value='site' className='cursor-pointer text-xs'>
              {t('bySite')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='type'>{eventTypeRows}</TabsContent>
          <TabsContent value='site'>
            <div className='flex flex-col gap-2.5'>
              {visibleSites.map((row) => (
                <BreakdownRow
                  key={row.siteId}
                  label={row.domain}
                  total={row.total}
                  percentageOfLimit={row.percentageOfLimit}
                />
              ))}
              {hiddenSiteCount > 0 && (
                <button
                  type='button'
                  onClick={() => setShowAllSites(true)}
                  className='text-primary hover:text-primary/90 focus-visible:ring-ring/50 self-start rounded-sm text-xs underline underline-offset-2 focus-visible:ring-[3px] focus-visible:outline-none'
                >
                  {t('showAllSites', { count: hiddenSiteCount })}
                </button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        eventTypeRows
      )}

      <div className='bg-muted/40 text-muted-foreground mt-2 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs'>
        <Info className='mt-px size-3.5 shrink-0' aria-hidden='true' />
        <span>{t('nonBillableNote')}</span>
      </div>
    </div>
  );
}

export default function UsageBreakdown() {
  const t = useTranslations('components.userSettings.billing.usage.breakdown');
  const [isOpen, setIsOpen] = useState(false);
  const { breakdown, isLoading, error } = useUsageBreakdown(isOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className='text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 group -ml-1.5 mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium focus-visible:ring-[3px] focus-visible:outline-none'>
        <ChevronRight className='size-3.5 transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none' />
        {t('trigger')}
      </CollapsibleTrigger>

      <CollapsibleContent className='border-border mt-3.5 border-t pt-4'>
        {isLoading && (
          <div className='flex flex-col gap-2.5'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
          </div>
        )}
        {error && <p className='text-muted-foreground text-xs'>{t('loadError')}</p>}
        {breakdown &&
          !isLoading &&
          (breakdown.total > 0 ? (
            <BreakdownRows breakdown={breakdown} />
          ) : (
            <p className='text-muted-foreground text-xs'>{t('empty')}</p>
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
