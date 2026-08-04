'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageRow } from '@/components/billing/UsageRow';
import { useUsageBreakdown } from '@/hooks/useUsageBreakdown';
import { useToggle } from '@/hooks/use-toggle';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import type { BillableEventType, UsageBreakdown as UsageBreakdownData } from '@/entities/billing/billing.entities';

const SITE_PREVIEW_COUNT = 5;

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
    <UsageRow
      percentageOfLimit={percentageOfLimit}
      label={<span className='truncate text-sm'>{label}</span>}
      value={
        <>
          {formatNumber(total, locale)}{' '}
          <span className='text-muted-foreground'>({formatPercentage(percentageOfLimit, locale)})</span>
        </>
      }
    />
  );
}

function RowList({ children }: { children: React.ReactNode }) {
  return <div className='flex flex-col gap-2.5'>{children}</div>;
}

function BreakdownRows({ breakdown }: { breakdown: UsageBreakdownData }) {
  const t = useTranslations('components.userSettings.billing.usage.breakdown');
  const { isOn: showAllSites, toggle: toggleAllSites } = useToggle();

  const visibleSites = showAllSites ? breakdown.bySite : breakdown.bySite.slice(0, SITE_PREVIEW_COUNT);
  const overflowSiteCount = breakdown.bySite.length - SITE_PREVIEW_COUNT;

  const eventTypeRows = (
    <RowList>
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
    </RowList>
  );

  return (
    <div className='flex flex-col gap-3.5'>
      {breakdown.bySite.length > 1 ? (
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
            <RowList>
              {visibleSites.map((row) => (
                <BreakdownRow
                  key={row.siteId}
                  label={row.domain}
                  total={row.total}
                  percentageOfLimit={row.percentageOfLimit}
                />
              ))}
              {overflowSiteCount > 0 && (
                <button
                  type='button'
                  onClick={toggleAllSites}
                  className='text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 -ml-1.5 cursor-pointer self-start rounded-md px-1.5 py-1 text-xs font-medium focus-visible:ring-[3px] focus-visible:outline-none'
                >
                  {showAllSites ? t('showFewerSites') : t('showAllSites', { count: overflowSiteCount })}
                </button>
              )}
            </RowList>
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

      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down border-border mt-3.5 overflow-hidden border-t pt-4'>
        {isLoading ? (
          <RowList>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
          </RowList>
        ) : error ? (
          <p className='text-muted-foreground text-xs'>{t('loadError')}</p>
        ) : breakdown && breakdown.total > 0 ? (
          <BreakdownRows breakdown={breakdown} />
        ) : (
          <p className='text-muted-foreground text-xs'>{t('empty')}</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
