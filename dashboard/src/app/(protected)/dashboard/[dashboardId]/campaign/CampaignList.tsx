'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPercentage } from '@/utils/formatters';
import type { CampaignListItem } from './CampaignDirectorySection';
import UTMBreakdownTabbedTable from './UTMBreakdownTabbedTable';
import UTMBreakdownTabbedChart from './UTMBreakdownTabbedChart';
import { Spinner } from '@/components/ui/spinner';
import type { CampaignExpandedDetails } from '@/app/actions/campaigns';
import { useCampaignExpandedDetails } from './useCampaignExpandedDetails';
import type { GranularityRangeValues } from '@/utils/granularityRanges';
import { useCampaignSparklines } from './useCampaignSparklines';
import CampaignSparkline from './CampaignSparkline';
import CampaignAudienceProfile from './CampaignAudienceProfile';
import { CompactPaginationControls, PaginationControls } from './CampaignPaginationControls';

type CampaignListProps = {
  campaigns: CampaignListItem[];
  dashboardId: string;
  startDate: string;
  endDate: string;
  granularity: GranularityRangeValues;
  timezone: string;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 10;

export default function CampaignList({
  campaigns,
  dashboardId,
  startDate,
  endDate,
  granularity,
  timezone,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
}: CampaignListProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const { detailsByCampaign, loadCampaignDetails } = useCampaignExpandedDetails({
    dashboardId,
    startDate,
    endDate,
  });

  const sortedCampaigns = useMemo(() => [...campaigns].sort((a, b) => b.visitors - a.visitors), [campaigns]);

  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedCampaigns = useMemo(() => {
    const start = safePageIndex * pageSize;
    return sortedCampaigns.slice(start, start + pageSize);
  }, [sortedCampaigns, pageSize, safePageIndex]);

  const { sparklines, statuses } = useCampaignSparklines({
    dashboardId,
    startDate,
    endDate,
    granularity,
    timezone,
    campaignNames: paginatedCampaigns.map((campaign) => campaign.name),
  });

  const toggleCampaignExpanded = (campaignName: string) => {
    setExpandedCampaign((prev) => {
      if (prev === campaignName) {
        return null;
      }
      loadCampaignDetails(campaignName);
      return campaignName;
    });
  };

  const handlePageChange = (newIndex: number) => {
    setPageIndex(newIndex);
    setExpandedCampaign(null);
  };

  const handlePageSizeChange = (newSize: number) => {
    const firstItemIndex = pageIndex * pageSize;
    const newPageIndex = Math.floor(firstItemIndex / newSize);
    setPageSize(newSize);
    setPageIndex(newPageIndex);
    setExpandedCampaign(null);
  };

  if (campaigns.length === 0) {
    return (
      <Card className='border-border/50 bg-muted/30 p-8 text-center'>
        <p className='text-lg font-medium'>No campaigns captured yet</p>
        <p className='text-muted-foreground mt-1 text-sm'>
          Start tagging traffic with `utm_campaign` to see performance here.
        </p>
      </Card>
    );
  }

  const showTopPagination = pageSize >= 25 && totalPages > 1;

  return (
    <div className='space-y-4'>
      {showTopPagination && (
        <CompactPaginationControls
          pageIndex={safePageIndex}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {paginatedCampaigns.map((campaign) => {
        const isExpanded = expandedCampaign === campaign.name;
        const detailsState = detailsByCampaign[campaign.name];
        const sparklineData = sparklines[campaign.name];
        const sparklineStatus = statuses[campaign.name];

        return (
          <article
            key={campaign.name}
            className='border-border/70 bg-card/80 hover:bg-card/90 hover:border-border/90 group relative overflow-hidden rounded-lg border shadow-sm transition duration-200 ease-out'
          >
            <div className='from-chart-1/70 to-chart-1/30 absolute top-0 left-0 h-full w-1 bg-gradient-to-b' />

            <div
              className='grid cursor-pointer grid-cols-[1fr_auto] items-center gap-4 py-4 pr-4 pl-5 md:grid-cols-[minmax(180px,1.5fr)_repeat(3,100px)_minmax(120px,200px)_auto]'
              onClick={() => toggleCampaignExpanded(campaign.name)}
            >
              <div className='min-w-0'>
                <p className='truncate text-sm leading-tight font-semibold'>{campaign.name}</p>
                <p className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
                  {campaign.visitors.toLocaleString()} {campaign.visitors === 1 ? 'session' : 'sessions'}
                </p>
              </div>

              <CampaignMetric
                label='Bounce rate'
                value={formatPercentage(campaign.bounceRate)}
                className='hidden md:flex'
              />
              <CampaignMetric
                label='Avg. duration'
                value={campaign.avgSessionDuration}
                className='hidden md:flex'
              />
              <CampaignMetric
                label='Pages/session'
                value={campaign.pagesPerSession.toFixed(1)}
                className='hidden md:flex'
              />

              <div className='hidden h-11 md:block'>
                <CampaignSparkline data={sparklineData} status={sparklineStatus} />
              </div>

              <Button
                variant='ghost'
                size='icon'
                className='shrink-0 cursor-pointer'
                onClick={(event) => {
                  event.stopPropagation();
                  toggleCampaignExpanded(campaign.name);
                }}
                aria-expanded={isExpanded}
                aria-controls={`campaign-${campaign.name}-details`}
              >
                {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
              </Button>
            </div>
            {isExpanded && (
              <div id={`campaign-${campaign.name}-details`} className='mx-3 mb-3 ml-5 space-y-4'>
                {!detailsState || detailsState.status === 'loading' ? (
                  <div className='flex items-center justify-center gap-3 py-8'>
                    <Spinner size='sm' aria-label='Loading campaign details' />
                    <span className='text-muted-foreground text-sm'>Loading campaign details...</span>
                  </div>
                ) : null}

                {detailsState?.status === 'error' ? (
                  <div className='bg-destructive/10 border-destructive/30 rounded-md border px-4 py-3'>
                    <p className='text-destructive text-sm'>
                      Failed to load campaign details. Please try expanding again.
                    </p>
                  </div>
                ) : null}

                {detailsState?.status === 'loaded' ? <CampaignInlineUTMSection {...detailsState.data} /> : null}
              </div>
            )}
          </article>
        );
      })}

      <PaginationControls
        pageIndex={safePageIndex}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sortedCampaigns.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
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

type CampaignInlineUTMSectionProps = CampaignExpandedDetails;

function CampaignInlineUTMSection({
  utmSource,
  utmMedium,
  utmContent,
  utmTerm,
  landingPages,
  devices,
  countries,
  browsers,
  operatingSystems,
}: CampaignInlineUTMSectionProps) {
  return (
    <div className='space-y-4'>
      <div className='text-muted-foreground flex items-center gap-3 text-[11px] font-medium tracking-wide uppercase'>
        <div className='bg-border/60 h-px flex-1' />
        <span>Campaign details</span>
        <div className='bg-border/60 h-px flex-1' />
      </div>
      <div className='mt-1 grid gap-3 md:grid-cols-5'>
        <div className='md:col-span-3'>
          <UTMBreakdownTabbedTable
            source={utmSource}
            medium={utmMedium}
            content={utmContent}
            term={utmTerm}
            landingPages={landingPages}
          />
        </div>
        <div className='md:col-span-2'>
          <div className='flex h-full flex-col gap-3'>
            <CampaignAudienceProfile
              devices={devices}
              countries={countries}
              browsers={browsers}
              operatingSystems={operatingSystems}
            />
            <UTMBreakdownTabbedChart source={utmSource} medium={utmMedium} content={utmContent} term={utmTerm} />
          </div>
        </div>
      </div>
    </div>
  );
}
