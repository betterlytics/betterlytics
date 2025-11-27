'use client';

import { useMemo, useState, useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPercentage, capitalizeFirstLetter } from '@/utils/formatters';
import type { CampaignListItem } from './CampaignDirectorySection';
import UTMBreakdownTabbedTable from './UTMBreakdownTabbedTable';
import UTMBreakdownTabbedChart from './UTMBreakdownTabbedChart';
import { Spinner } from '@/components/ui/spinner';
import type { CampaignExpandedDetails } from '@/app/actions/campaigns';
import { useCampaignExpandedDetails } from './useCampaignExpandedDetails';
import { BrowserIcon, DeviceIcon, FlagIcon, OSIcon, type FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { useLocale } from 'next-intl';
import type { GranularityRangeValues } from '@/utils/granularityRanges';
import { useCampaignSparklines } from './useCampaignSparklines';
import type { CampaignSparklinePoint } from '@/app/actions/campaigns';

type CampaignListProps = {
  campaigns: CampaignListItem[];
  dashboardId: string;
  startDate: string;
  endDate: string;
  granularity: GranularityRangeValues;
  timezone: string;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 6;

export default function CampaignList({
  campaigns,
  dashboardId,
  startDate,
  endDate,
  granularity,
  timezone,
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

  const { sparklines, statuses } = useCampaignSparklines({
    dashboardId,
    startDate,
    endDate,
    granularity,
    timezone,
    campaignNames: paginatedCampaigns.map((campaign) => campaign.name),
  });

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
        const sparklineData = sparklines[campaign.name];
        const sparklineStatus = statuses[campaign.name];

        return (
          <article
            key={campaign.name}
            className='border-border/70 bg-card/80 hover:bg-card/90 focus-within:ring-offset-background hover:border-border/90 group relative overflow-hidden rounded-lg border shadow-sm transition duration-200 ease-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
          >
            <div className='from-chart-1/70 to-chart-1/30 absolute top-0 left-0 h-full w-1 bg-gradient-to-b' />

            <div className='grid grid-cols-[1fr_auto] items-center gap-4 py-4 pr-4 pl-5 md:grid-cols-[minmax(180px,1.5fr)_repeat(3,80px)_minmax(120px,200px)_auto]'>
              <div className='min-w-0'>
                <p className='truncate text-sm leading-tight font-semibold'>{campaign.name}</p>
                <p className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
                  {campaign.visitors.toLocaleString()} {campaign.visitors === 1 ? 'session' : 'sessions'}
                </p>
              </div>

              <CampaignMetric
                label='Bounce'
                value={formatPercentage(campaign.bounceRate)}
                className='hidden md:flex'
              />
              <CampaignMetric label='Duration' value={campaign.avgSessionDuration} className='hidden md:flex' />
              <CampaignMetric
                label='Pages'
                value={campaign.pagesPerSession.toFixed(1)}
                className='hidden md:flex'
              />

              <div className='hidden h-11 md:block'>
                <CampaignSparkline data={sparklineData} status={sparklineStatus} />
              </div>

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
            {isExpanded && (
              <div id={`campaign-${campaign.name}-details`} className='mx-3 mb-3 ml-5 space-y-4'>
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

function CampaignMetric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      <span className='text-muted-foreground text-[10px] font-medium tracking-wide uppercase'>{label}</span>
      <span className='text-foreground text-sm font-semibold tabular-nums'>{value}</span>
    </div>
  );
}

type CampaignSparklineProps = {
  data?: CampaignSparklinePoint[];
  status?: 'idle' | 'loading' | 'loaded' | 'error';
};

function CampaignSparkline({ data, status }: CampaignSparklineProps) {
  const gradientId = useId();
  const isLoading = status === 'loading' && (!data || data.length === 0);
  const hasData = data && data.length > 0;

  if (!hasData && !isLoading) {
    return <div className='bg-muted/40 h-full w-full rounded-md' aria-hidden='true' />;
  }

  if (isLoading && !hasData) {
    return <div className='bg-muted/50 h-full w-full animate-pulse rounded-md' aria-hidden='true' />;
  }

  return (
    <div className='h-full w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`campaign-sparkline-${gradientId}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='var(--chart-1)' stopOpacity={0.9} />
              <stop offset='100%' stopColor='var(--chart-1)' stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <RechartsTooltip
            cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.85, strokeWidth: 1.5 }}
            content={(props: TooltipProps<number, string>) => {
              const { active, payload } = props;
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as CampaignSparklinePoint;
              const date = new Date(point.date);
              return (
                <div className='bg-popover text-popover-foreground border-border rounded-md border px-3 py-1.5 text-[11px] shadow-lg'>
                  <div className='text-muted-foreground mb-0.5'>
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className='text-foreground text-xs font-semibold'>
                    {point.visitors.toLocaleString()} sessions
                  </div>
                </div>
              );
            }}
          />
          <Area
            type='linear'
            dataKey='visitors'
            stroke='var(--chart-1)'
            strokeWidth={2.5}
            fill={`url(#campaign-sparkline-${gradientId})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
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

type AudienceShare = {
  label: string;
  value: string;
};

type CampaignAudienceProfileProps = {
  devices?: AudienceShare[];
  countries?: AudienceShare[];
  browsers?: AudienceShare[];
  operatingSystems?: AudienceShare[];
};

function CampaignAudienceProfile({
  devices,
  countries,
  browsers,
  operatingSystems,
}: CampaignAudienceProfileProps) {
  const locale = useLocale();

  const hasDevices = devices && devices.length > 0;
  const hasCountries = countries && countries.length > 0;
  const hasBrowsers = browsers && browsers.length > 0;
  const hasOperatingSystems = operatingSystems && operatingSystems.length > 0;

  const sections: { key: string; title: string; items: AudienceShare[] }[] = [
    { key: 'devices', title: 'Devices', items: hasDevices ? devices!.slice(0, 3) : [] },
    { key: 'browsers', title: 'Browsers', items: hasBrowsers ? browsers!.slice(0, 3) : [] },
    { key: 'os', title: 'OS', items: hasOperatingSystems ? operatingSystems!.slice(0, 3) : [] },
    { key: 'countries', title: 'Countries', items: hasCountries ? countries!.slice(0, 3) : [] },
  ].filter((section) => section.items.length > 0);

  if (sections.length === 0) {
    return (
      <div className='text-muted-foreground flex items-center justify-end px-1 py-2 text-[11px]'>
        No audience data for this campaign in the selected range.
      </div>
    );
  }

  return (
    <section aria-label='Audience profile' className='space-y-2'>
      <div className='px-1'>
        <p className='text-foreground text-sm font-medium'>Audience profile</p>
        <div className='bg-border/60 mt-1 h-px w-full' />
      </div>
      <div className='pt-1 text-[11px]'>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {sections.map((section) => (
            <div key={section.key} className='space-y-1'>
              <p className='text-foreground text-[11px] font-medium'>{section.title}</p>
              <div className='space-y-1.5'>
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className='bg-muted/60 text-muted-foreground flex items-center justify-between rounded-full px-2 py-0.5'
                  >
                    <div className='flex min-w-0 items-center gap-1.5'>
                      {getAudienceIconAndLabel(section.key, item.label, locale).icon}
                      <span className='truncate'>
                        {getAudienceIconAndLabel(section.key, item.label, locale).label}
                      </span>
                    </div>
                    <span className='text-foreground ml-1 shrink-0 font-medium'>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getAudienceIconAndLabel(sectionKey: string, rawLabel: string, locale: string) {
  switch (sectionKey) {
    case 'devices':
      return {
        icon: <DeviceIcon type={rawLabel} className='h-3.5 w-3.5' />,
        label: capitalizeFirstLetter(rawLabel),
      };
    case 'browsers':
      return {
        icon: <BrowserIcon name={rawLabel} className='h-3.5 w-3.5' />,
        label: capitalizeFirstLetter(rawLabel),
      };
    case 'os':
      return {
        icon: <OSIcon name={rawLabel} className='h-3.5 w-3.5' />,
        label: capitalizeFirstLetter(rawLabel),
      };
    case 'countries': {
      const code = rawLabel.toUpperCase() as FlagIconProps['countryCode'];
      const name = getCountryName(code, locale as Parameters<typeof getCountryName>[1]);
      return {
        icon: <FlagIcon countryCode={code} countryName={name} />,
        label: name,
      };
    }
    default:
      return {
        icon: null,
        label: rawLabel,
      };
  }
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
