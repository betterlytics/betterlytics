'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import type { CampaignListItem } from './CampaignDirectorySection';
import UTMBreakdownTabbedTable from './UTMBreakdownTabbedTable';
import UTMBreakdownTabbedChart from './UTMBreakdownTabbedChart';
import { Spinner } from '@/components/ui/spinner';
import type { CampaignExpandedDetails } from '@/app/actions/campaigns';
import { useCampaignExpandedDetails } from './useCampaignExpandedDetails';

type CampaignListProps = {
  campaigns: CampaignListItem[];
  dashboardId: string;
  startDate: string;
  endDate: string;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 6;

export default function CampaignList({
  campaigns,
  dashboardId,
  startDate,
  endDate,
  pageSize = DEFAULT_PAGE_SIZE,
}: CampaignListProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const { detailsByCampaign, loadCampaignDetails } = useCampaignExpandedDetails({
    dashboardId,
    startDate,
    endDate,
  });

  const totalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedCampaigns = useMemo(() => {
    const start = safePageIndex * pageSize;
    return campaigns.slice(start, start + pageSize);
  }, [campaigns, pageSize, safePageIndex]);

  const handlePageChange = (newIndex: number) => {
    setPageIndex(newIndex);
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

  return (
    <div className='space-y-4'>
      {paginatedCampaigns.map((campaign) => {
        const isExpanded = expandedCampaign === campaign.name;
        const detailsState = detailsByCampaign[campaign.name];

        return (
          <article
            key={campaign.name}
            className='border-border/70 bg-card/80 hover:bg-card/90 focus-within:ring-offset-background hover:border-border/90 relative rounded-2xl border p-4 shadow-sm transition duration-200 ease-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
          >
            <div className='flex items-start justify-between gap-4 md:items-center'>
              <div className='flex flex-1 flex-col gap-1'>
                <div className='flex flex-wrap items-center gap-3'>
                  <p className='text-base leading-tight font-semibold'>{campaign.name}</p>
                  <span className='border-border/60 text-muted-foreground rounded-full border px-2 py-0.5 text-xs'>
                    {campaign.visitors.toLocaleString()} sessions
                  </span>
                </div>
                <div className='text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs'>
                  <MetricPill label='Visitors' value={formatNumber(campaign.visitors)} />
                  <MetricPill label='Bounce rate' value={formatPercentage(campaign.bounceRate)} />
                  <MetricPill label='Avg. session' value={campaign.avgSessionDuration} />
                  <MetricPill label='Pages / session' value={campaign.pagesPerSession.toFixed(1)} />
                </div>
              </div>
              <div className='flex items-center'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='shrink-0'
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedCampaign(null);
                      return;
                    }
                    setExpandedCampaign(campaign.name);
                    loadCampaignDetails(campaign.name);
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`campaign-${campaign.name}-details`}
                >
                  {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                </Button>
              </div>
            </div>
            {isExpanded && (
              <div id={`campaign-${campaign.name}-details`} className='mt-4 space-y-4'>
                {!detailsState || detailsState.status === 'loading' ? (
                  <div className='flex justify-center py-6'>
                    <Spinner size='sm' aria-label='Loading campaign details' />
                  </div>
                ) : null}

                {detailsState?.status === 'error' ? (
                  <p className='text-destructive text-xs'>
                    Failed to load campaign details. Please try expanding again.
                  </p>
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
        onChange={(direction) => handlePageChange(safePageIndex + direction)}
        disablePrevious={safePageIndex === 0}
        disableNext={safePageIndex >= totalPages - 1}
      />
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <Badge
      variant='outline'
      className='text-muted-foreground bg-background/60 border-border/60 h-7 rounded-full px-2.5 text-[11px] font-normal'
    >
      <span className='text-foreground/80 mr-1 font-medium'>{label}</span>
      <span>{value}</span>
    </Badge>
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
}: CampaignInlineUTMSectionProps) {
  return (
    <div className='space-y-4'>
      <div className='text-muted-foreground flex items-center gap-3 text-[11px] font-medium tracking-wide uppercase'>
        <div className='bg-border/60 h-px flex-1' />
        <span>Campaign details</span>
        <div className='bg-border/60 h-px flex-1' />
      </div>
      <div className='mt-1 grid gap-3 md:grid-cols-3'>
        <div className='md:col-span-2'>
          <UTMBreakdownTabbedTable
            source={utmSource}
            medium={utmMedium}
            content={utmContent}
            term={utmTerm}
            landingPages={landingPages}
          />
        </div>
        <div className='md:col-span-1'>
          <div className='flex h-full flex-col gap-3'>
            <CampaignAudienceProfile devices={devices} countries={countries} />
            <UTMBreakdownTabbedChart source={utmSource} medium={utmMedium} content={utmContent} term={utmTerm} />
          </div>
        </div>
      </div>
    </div>
  );
}

type AudienceShare = {
  label: string;
  value: string;
};

type CampaignAudienceProfileProps = {
  devices?: AudienceShare[];
  countries?: AudienceShare[];
};

function CampaignAudienceProfile({ devices, countries }: CampaignAudienceProfileProps) {
  const hasDevices = devices && devices.length > 0;
  const hasCountries = countries && countries.length > 0;

  if (!hasDevices && !hasCountries) {
    return (
      <Card className='border-border/60'>
        <CardContent className='text-muted-foreground flex items-center justify-center px-3 py-3 text-xs'>
          No audience data for this campaign in the selected range.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/60'>
      <CardHeader className='px-3 pt-2 pb-1 sm:px-4 sm:pt-2 sm:pb-1'>
        <CardTitle className='text-sm font-medium'>Audience profile</CardTitle>
      </CardHeader>
      <CardContent className='px-3 pt-0 pb-2 text-[11px] sm:px-4'>
        {hasDevices && (
          <div className='mb-3'>
            <p className='text-foreground mb-1 text-[11px] font-medium'>Devices</p>
            <div className='flex flex-wrap gap-1.5'>
              {devices!.map((item) => (
                <span
                  key={item.label}
                  className='bg-muted/60 text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[11px]'
                >
                  {item.label}
                  <span className='text-foreground ml-1 font-medium'>{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {hasCountries && (
          <div>
            <p className='text-foreground mb-1 text-[11px] font-medium'>Top countries</p>
            <div className='flex flex-wrap gap-1.5'>
              {countries!.map((item) => (
                <span
                  key={item.label}
                  className='bg-muted/60 text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[11px]'
                >
                  {item.label}
                  <span className='text-foreground ml-1 font-medium'>{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PaginationControlsProps = {
  pageIndex: number;
  totalPages: number;
  disablePrevious: boolean;
  disableNext: boolean;
  onChange: (direction: -1 | 1) => void;
};

function PaginationControls({
  pageIndex,
  totalPages,
  disablePrevious,
  disableNext,
  onChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className='border-border/50 bg-background/60 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm'>
      <p className='text-muted-foreground'>
        Page {pageIndex + 1} of {totalPages}
      </p>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={disablePrevious}
          onClick={() => onChange(-1)}
          aria-label='Previous page'
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={disableNext}
          onClick={() => onChange(1)}
          aria-label='Next page'
        >
          Next
        </Button>
      </div>
    </div>
  );
}
