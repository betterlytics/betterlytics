'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button } from '@/components/ui';
import { Stack, Inline, Grid } from '@/components/layout';
import { Text } from '@/components/text';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import type { CampaignListRowSummary } from '@/entities/analytics/campaign.entities';
import UTMBreakdownTabbedTable from './UTMBreakdownTabbedTable';
import UTMBreakdownTabbedChart from './UTMBreakdownTabbedChart';
import { Spinner } from '@/components/ui/spinner';
import type { CampaignExpandedDetails } from '@/app/actions/analytics/campaign.actions';
import {
  fetchCampaignExpandedDetailsAction,
  fetchCampaignPerformanceAction,
} from '@/app/actions/analytics/campaign.actions';
import CampaignSparkline from './CampaignSparkline';
import CampaignAudienceProfile from './CampaignAudienceProfile';
import { CompactPaginationControls, PaginationControls } from './CampaignPaginationControls';
import { useTranslations } from 'next-intl';
import CampaignRowSkeleton from '@/components/skeleton/CampaignRowSkeleton';
import { toast } from 'sonner';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import ExternalLink from '@/components/ExternalLink';

type CampaignListItem = CampaignListRowSummary;

type CampaignListProps = {
  dashboardId: string;
};

const DEFAULT_PAGE_SIZE = 10;

export default function CampaignList({ dashboardId }: CampaignListProps) {
  const { startDate, endDate, granularity, timeZone } = useTimeRangeContext();
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const t = useTranslations('components.campaign');
  const { staleTime, gcTime, refetchOnWindowFocus, refetchInterval } = useTimeRangeQueryOptions();

  const { data: performancePage, isLoading } = useQuery<{
    campaigns: CampaignListItem[];
    totalCampaigns: number;
    pageIndex: number;
    pageSize: number;
  }>({
    queryKey: ['campaign-list', dashboardId, startDate, endDate, granularity, timeZone, pageIndex, pageSize],
    queryFn: async () => {
      try {
        return await fetchCampaignPerformanceAction(
          dashboardId,
          startDate,
          endDate,
          granularity,
          timeZone,
          pageIndex,
          pageSize,
        );
      } catch {
        toast.error(t('campaignExpandedRow.error'));
        return {
          campaigns: [] as CampaignListItem[],
          totalCampaigns: 0,
          pageIndex: 0,
          pageSize,
        };
      }
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    refetchInterval,
  });

  const campaigns = (performancePage?.campaigns as CampaignListItem[]) ?? [];
  const totalCampaigns = performancePage?.totalCampaigns ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalCampaigns / pageSize));
  const safePageIndex = Math.min(Math.max(pageIndex, 0), totalPages - 1);

  const toggleCampaignExpanded = (campaignName: string) => {
    setExpandedCampaign((prev) => (prev === campaignName ? null : campaignName));
  };

  const handlePageChange = (newIndex: number) => {
    if (newIndex === pageIndex) return;
    setExpandedCampaign(null);
    setPageIndex(newIndex);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (newSize === pageSize) return;
    setExpandedCampaign(null);
    setPageIndex(0);
    setPageSize(newSize);
  };

  if (!isLoading && campaigns.length === 0) {
    return <CampaignEmptyState />;
  }

  const showTopPagination = pageSize >= 25 && totalPages > 1;
  const isInitialLoading = isLoading && campaigns.length === 0;
  const skeletonRowCount = pageSize || DEFAULT_PAGE_SIZE;

  return (
    <Stack className='pb-8 md:pb-0'>
      {showTopPagination && (
        <CompactPaginationControls
          pageIndex={safePageIndex}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {isInitialLoading
        ? Array.from({ length: skeletonRowCount }).map((_, index) => <CampaignRowSkeleton key={index} />)
        : campaigns.map((campaign) => {
            return (
              <CampaignListEntry
                key={campaign.name}
                campaign={campaign}
                dashboardId={dashboardId}
                isExpanded={expandedCampaign === campaign.name}
                onToggle={() => toggleCampaignExpanded(campaign.name)}
              />
            );
          })}

      <PaginationControls
        pageIndex={safePageIndex}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalCampaigns}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </Stack>
  );
}

function CampaignEmptyState() {
  const t = useTranslations('components.campaign.emptyState');

  return (
    <Card variant='empty'>
      <div className='mx-auto max-w-md'>
        <div className='bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
          <DollarSign className='text-muted-foreground h-6 w-6' />
        </div>

        <h3 className='text-lg font-semibold'>{t('title')}</h3>
        <p className='text-muted-foreground mt-2 text-sm'>{t('description')}</p>

        <p className='text-muted-foreground mt-6 text-sm'>
          {t('docsHint')}{' '}
          <ExternalLink
            href='/docs/dashboard/campaigns'
            className='text-primary underline-offset-4 hover:underline'
          >
            {t('docsLinkLabel')}
          </ExternalLink>
        </p>
      </div>
    </Card>
  );
}

type CampaignListEntryProps = {
  campaign: CampaignListItem;
  dashboardId: string;
  isExpanded: boolean;
  onToggle: () => void;
};

function CampaignListEntry({ campaign, dashboardId, isExpanded, onToggle }: CampaignListEntryProps) {
  const t = useTranslations('components.campaign.campaignRow');
  const visitorsLabel = t('visitors', { count: campaign.visitors });
  const detailsId = `campaign-${campaign.name}-details`;
  return (
    <article className='border-border/70 bg-card/80 hover:bg-card/90 hover:border-border/90 group relative rounded-lg border p-1 shadow-sm transition duration-200 ease-out'>
      <div className='from-chart-1/70 to-chart-1/30 absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b' />

      {/* Mobile / tablet header row */}
      <div
        className='flex cursor-pointer items-center justify-between gap-3 px-4 py-3 lg:hidden'
        onClick={onToggle}
      >
        <CampaignHeaderTitle name={campaign.name} sessionsLabel={visitorsLabel} />
        <Inline gap='list'>
          <div className='h-11 min-w-[150px] flex-1'>
            <CampaignSparkline data={campaign.sparkline} />
          </div>
          <CampaignToggleButton isExpanded={isExpanded} onToggle={onToggle} controlsId={detailsId} />
        </Inline>
      </div>

      {/* Desktop header row */}
      <div
        className='hidden cursor-pointer grid-cols-[minmax(180px,1.5fr)_repeat(3,auto)_minmax(140px,220px)_auto] items-center gap-4 px-4 py-3 lg:grid'
        onClick={onToggle}
      >
        <CampaignHeaderTitle name={campaign.name} sessionsLabel={visitorsLabel} />

        <CampaignMetric label={t('bounceRate')} value={formatPercentage(campaign.bounceRate)} className='flex' />
        <CampaignMetric label={t('avgSessionDuration')} value={campaign.avgSessionDuration} className='flex' />
        <CampaignMetric
          label={t('pagesPerSession')}
          value={formatNumber(campaign.pagesPerSession)}
          className='flex'
        />

        <div className='h-14'>
          <CampaignSparkline data={campaign.sparkline} />
        </div>

        <CampaignToggleButton isExpanded={isExpanded} onToggle={onToggle} controlsId={detailsId} />
      </div>
      <CampaignExpandedRow
        isExpanded={isExpanded}
        dashboardId={dashboardId}
        campaignName={campaign.name}
        summary={{
          visitors: campaign.visitors,
          bounceRate: campaign.bounceRate,
          avgSessionDuration: campaign.avgSessionDuration,
          pagesPerSession: campaign.pagesPerSession,
        }}
      />
    </article>
  );
}

type CampaignHeaderTitleProps = {
  name: string;
  sessionsLabel: string;
};

function CampaignHeaderTitle({ name, sessionsLabel }: CampaignHeaderTitleProps) {
  return (
    <Stack gap='minimal' className='min-w-0'>
      <Text variant='value-sm' className='truncate'>
        {name}
      </Text>
      <Text variant='caption' tabular>
        {sessionsLabel}
      </Text>
    </Stack>
  );
}

type CampaignToggleButtonProps = {
  isExpanded: boolean;
  onToggle: () => void;
  controlsId: string;
};

function CampaignToggleButton({ isExpanded, onToggle, controlsId }: CampaignToggleButtonProps) {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='shrink-0 cursor-pointer'
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-expanded={isExpanded}
      aria-controls={controlsId}
    >
      {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
    </Button>
  );
}

function CampaignMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col justify-end ${className ?? ''}`}>
      <Text variant='column-header'>{label}</Text>
      <Text variant='value-sm'>{value}</Text>
    </div>
  );
}

type CampaignInlineUTMSectionProps = {
  details: CampaignExpandedDetails;
  dashboardId: string;
  campaignName: string;
  summary: {
    visitors: number;
    bounceRate: number;
    avgSessionDuration: string;
    pagesPerSession: number;
  };
};

function CampaignInlineUTMSection({ details, dashboardId, campaignName, summary }: CampaignInlineUTMSectionProps) {
  const { utmSource, landingPages, devices, countries, browsers, operatingSystems } = details;
  const t = useTranslations('components.campaign.campaignExpandedRow');
  const tRow = useTranslations('components.campaign.campaignRow');

  return (
    <Stack>
      <Inline className='uppercase'>
        <div className='bg-border/60 h-px flex-1' />
        <Text variant='column-header'>{t('campaignDetails')}</Text>
        <div className='bg-border/60 h-px flex-1' />
      </Inline>
      <Grid cols={{ lg: 5 }} gap='card'>
        <div className='hidden lg:col-span-3 lg:block'>
          <UTMBreakdownTabbedTable
            dashboardId={dashboardId}
            campaignName={campaignName}
            initialSource={utmSource}
            landingPages={landingPages}
          />
        </div>
        <div className='space-y-section lg:col-span-2'>
          <div className='lg:hidden'>
            <Grid cols={2} gap='card'>
              <Stack gap='minimal'>
                <Text variant='column-header'>{tRow('bounceRate')}</Text>
                <Text variant='value-sm'>{formatPercentage(summary.bounceRate)}</Text>
              </Stack>
              <Stack gap='minimal'>
                <Text variant='column-header'>{tRow('pagesPerSession')}</Text>
                <Text variant='value-sm'>{formatNumber(summary.pagesPerSession)}</Text>
              </Stack>
            </Grid>
          </div>
          <Stack gap='card'>
            <CampaignAudienceProfile
              devices={devices}
              countries={countries}
              browsers={browsers}
              operatingSystems={operatingSystems}
            />
            <UTMBreakdownTabbedChart
              dashboardId={dashboardId}
              campaignName={campaignName}
              initialSource={utmSource}
            />
          </Stack>
        </div>
      </Grid>
    </Stack>
  );
}

type CampaignExpandedRowProps = {
  isExpanded: boolean;
  dashboardId: string;
  campaignName: string;
  summary: {
    visitors: number;
    bounceRate: number;
    avgSessionDuration: string;
    pagesPerSession: number;
  };
};

function CampaignExpandedRow({ isExpanded, dashboardId, campaignName, summary }: CampaignExpandedRowProps) {
  const { startDate, endDate } = useTimeRangeContext();
  const { data, status } = useQuery({
    queryKey: ['campaign-expanded-details', dashboardId, campaignName, startDate, endDate],
    queryFn: () => fetchCampaignExpandedDetailsAction(dashboardId, startDate, endDate, campaignName),
    enabled: isExpanded,
    staleTime: getExpandedDetailsStaleTime(startDate, endDate),
    gcTime: 15 * 60 * 1000,
  });
  const t = useTranslations('components.campaign.campaignExpandedRow');
  if (!isExpanded) {
    return null;
  }

  return (
    <Stack id={`campaign-${campaignName}-details`} className='mx-3 ml-5 pb-3'>
      {status === 'pending' ? (
        <Inline justify='center' align='center' gap='card' className='py-8'>
          <Spinner size='sm' aria-label='Loading campaign details' />
          <Text variant='description'>{t('loading')}</Text>
        </Inline>
      ) : null}

      {status === 'error' ? (
        <div className='bg-destructive/10 border-destructive/30 rounded-md border px-4 py-3'>
          <Text variant='description' tone='danger'>
            {t('error')}
          </Text>
        </div>
      ) : null}

      {status === 'success' && data ? (
        <CampaignInlineUTMSection
          details={data}
          dashboardId={dashboardId}
          campaignName={campaignName}
          summary={summary}
        />
      ) : null}
    </Stack>
  );
}

function getExpandedDetailsStaleTime(startDate: Date, endDate: Date) {
  const rangeMs = endDate.getTime() - startDate.getTime();
  const hourMs = 60 * 60 * 1000;
  if (rangeMs <= hourMs) {
    return 30_000;
  }
  if (rangeMs <= 24 * hourMs) {
    return 5 * 60 * 1000;
  }
  return 15 * 60 * 1000;
}
