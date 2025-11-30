'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import type { CampaignListItem } from './CampaignDirectorySection';
import UTMBreakdownTabbedTable from './UTMBreakdownTabbedTable';
import UTMBreakdownTabbedChart from './UTMBreakdownTabbedChart';
import { Spinner } from '@/components/ui/spinner';
import type { CampaignExpandedDetails } from '@/app/actions/campaigns';
import { fetchCampaignExpandedDetailsAction, fetchCampaignPerformanceAction } from '@/app/actions/campaigns';
import CampaignSparkline from './CampaignSparkline';
import CampaignAudienceProfile from './CampaignAudienceProfile';
import { CompactPaginationControls, PaginationControls } from './CampaignPaginationControls';
import { useTranslations } from 'next-intl';
import CampaignRowSkeleton from '@/components/skeleton/CampaignRowSkeleton';
import { toast } from 'sonner';
import ExternalLink from '@/components/ExternalLink';

type CampaignListProps = {
  campaigns: CampaignListItem[];
  dashboardId: string;
  pageIndex: number;
  pageSize: number;
  totalCampaigns: number;
};

export default function CampaignList({
  campaigns: initialCampaigns,
  dashboardId,
  pageIndex: initialPageIndex,
  pageSize: initialPageSize,
  totalCampaigns: initialTotalCampaigns,
}: CampaignListProps) {
  const { startDate, endDate, granularity, timeZone } = useTimeRangeContext();
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(initialPageIndex);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>(initialCampaigns);
  const [totalCampaigns, setTotalCampaigns] = useState<number>(initialTotalCampaigns);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);
  const t = useTranslations('components.campaign');

  // When the server-fetched campaign data changes (e.g. due to a new time range), then we sync the list state again
  useEffect(() => {
    setCampaigns(initialCampaigns);
    setTotalCampaigns(initialTotalCampaigns);
    setPageIndex(initialPageIndex);
    setPageSize(initialPageSize);
    setExpandedCampaign(null);
    setIsLoadingPage(false);
  }, [initialCampaigns, initialTotalCampaigns, initialPageIndex, initialPageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCampaigns / pageSize));
  const safePageIndex = Math.min(Math.max(pageIndex, 0), totalPages - 1);

  const paginatedCampaigns = useMemo(() => campaigns, [campaigns]);

  const toggleCampaignExpanded = (campaignName: string) => {
    setExpandedCampaign((prev) => (prev === campaignName ? null : campaignName));
  };

  const loadPage = async (nextPageIndex: number, nextPageSize: number) => {
    if (isLoadingPage) {
      return;
    }

    setExpandedCampaign(null);
    setIsLoadingPage(true);

    try {
      const result = await fetchCampaignPerformanceAction(
        dashboardId,
        startDate,
        endDate,
        granularity,
        timeZone,
        nextPageIndex,
        nextPageSize,
      );

      setCampaigns(result.campaigns as CampaignListItem[]);
      setTotalCampaigns(result.totalCampaigns);
      setPageIndex(result.pageIndex);
      setPageSize(result.pageSize);
    } catch {
      toast.error(t('campaignExpandedRow.error'));
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handlePageChange = (newIndex: number) => {
    if (newIndex === pageIndex) return;
    void loadPage(newIndex, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (newSize === pageSize) return;
    void loadPage(0, newSize);
  };

  if (campaigns.length === 0) {
    return <CampaignEmptyState />;
  }

  const showTopPagination = pageSize >= 25 && totalPages > 1;
  const skeletonRowCount = Math.min(pageSize || 10, 10);

  return (
    <div className='space-y-4 pb-8 md:pb-0'>
      {showTopPagination && (
        <CompactPaginationControls
          pageIndex={safePageIndex}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {isLoadingPage
        ? Array.from({ length: skeletonRowCount }).map((_, index) => <CampaignRowSkeleton key={index} />)
        : paginatedCampaigns.map((campaign) => {
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
    </div>
  );
}

function CampaignEmptyState() {
  const t = useTranslations('components.campaign.emptyState');

  return (
    <Card className='border-border/50 bg-card/80 px-6 py-10 text-center'>
      <div className='mx-auto max-w-md'>
        <div className='bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
          <DollarSign className='text-muted-foreground h-6 w-6' />
        </div>

        <h3 className='text-lg font-semibold'>{t('title')}</h3>
        <p className='text-muted-foreground mt-2 text-sm'>{t('description')}</p>

        {/* TODO: Uncomment when campaign page is implemented
        <p className='text-muted-foreground mt-6 text-sm'>
          {t('docsHint')}{' '}
          <ExternalLink href='/docs/campaign-tracking' className='text-primary underline-offset-4 hover:underline'>
            {t('docsLinkLabel')}
          </ExternalLink>
        </p>
        */}
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
  return (
    <article className='border-border/70 bg-card/80 hover:bg-card/90 hover:border-border/90 group relative rounded-lg border pb-3 shadow-sm transition duration-200 ease-out'>
      <div className='from-chart-1/70 to-chart-1/30 absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b' />

      <div
        className='grid cursor-pointer grid-cols-[1fr_auto] items-center gap-5 py-4 pr-4 pl-5 md:grid-cols-[minmax(180px,1.5fr)_repeat(3,100px)_minmax(120px,200px)_auto]'
        onClick={onToggle}
      >
        <div className='min-w-0'>
          <p className='truncate text-sm leading-tight font-semibold'>{campaign.name}</p>
          <p className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
            {t('sessions', { count: campaign.visitors })}
          </p>
        </div>

        <CampaignMetric
          label={t('bounceRate')}
          value={formatPercentage(campaign.bounceRate)}
          className='hidden md:flex'
        />
        <CampaignMetric
          label={t('avgSessionDuration')}
          value={campaign.avgSessionDuration}
          className='hidden md:flex'
        />
        <CampaignMetric
          label={t('pagesPerSession')}
          value={campaign.pagesPerSession.toFixed(1)}
          className='hidden md:flex'
        />

        <div className='hidden h-11 md:block'>
          <CampaignSparkline data={campaign.sparkline} />
        </div>

        <Button
          variant='ghost'
          size='icon'
          className='shrink-0 cursor-pointer'
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          aria-expanded={isExpanded}
          aria-controls={`campaign-${campaign.name}-details`}
        >
          {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
        </Button>
      </div>
      <CampaignExpandedRow isExpanded={isExpanded} dashboardId={dashboardId} campaignName={campaign.name} />
    </article>
  );
}

function CampaignMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col justify-end ${className ?? ''}`}>
      <span className='text-muted-foreground text-[10px] leading-tight font-medium tracking-wide uppercase'>
        {label}
      </span>
      <span className='text-foreground text-sm font-semibold tabular-nums'>{value}</span>
    </div>
  );
}

type CampaignInlineUTMSectionProps = {
  details: CampaignExpandedDetails;
  dashboardId: string;
  campaignName: string;
};

function CampaignInlineUTMSection({ details, dashboardId, campaignName }: CampaignInlineUTMSectionProps) {
  const { utmSource, landingPages, devices, countries, browsers, operatingSystems } = details;
  const t = useTranslations('components.campaign.campaignExpandedRow');

  return (
    <div className='space-y-4'>
      <div className='text-muted-foreground flex items-center gap-3 text-[11px] font-medium tracking-wide uppercase'>
        <div className='bg-border/60 h-px flex-1' />
        <span>{t('campaignDetails')}</span>
        <div className='bg-border/60 h-px flex-1' />
      </div>
      <div className='mt-1 grid gap-3 md:grid-cols-5'>
        <div className='hidden md:col-span-3 md:block'>
          <UTMBreakdownTabbedTable
            dashboardId={dashboardId}
            campaignName={campaignName}
            initialSource={utmSource}
            landingPages={landingPages}
          />
        </div>
        <div className='space-y-3 md:col-span-2'>
          <p className='border-border/60 bg-muted/30 text-muted-foreground rounded-md border border-dashed px-3 py-2 text-[11px] md:hidden'>
            {t('onlyAvailableOnLargerScreens')}
          </p>
          <div className='flex flex-col gap-3'>
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
          </div>
        </div>
      </div>
    </div>
  );
}

type CampaignExpandedRowProps = {
  isExpanded: boolean;
  dashboardId: string;
  campaignName: string;
};

function CampaignExpandedRow({ isExpanded, dashboardId, campaignName }: CampaignExpandedRowProps) {
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
    <div id={`campaign-${campaignName}-details`} className='mx-3 ml-5 space-y-4 pb-3'>
      {status === 'pending' ? (
        <div className='flex items-center justify-center gap-3 py-8'>
          <Spinner size='sm' aria-label='Loading campaign details' />
          <span className='text-muted-foreground text-sm'>{t('loading')}</span>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className='bg-destructive/10 border-destructive/30 rounded-md border px-4 py-3'>
          <p className='text-destructive text-sm'>{t('error')}</p>
        </div>
      ) : null}

      {status === 'success' && data ? (
        <CampaignInlineUTMSection details={data} dashboardId={dashboardId} campaignName={campaignName} />
      ) : null}
    </div>
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
