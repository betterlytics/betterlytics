'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { FlagIcon, type FlagIconProps } from '@/components/icons/FlagIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { StacktraceView } from './StacktraceView';
import { fetchErrorOccurrenceAction } from '@/app/actions/analytics/errors.actions';
import type { ErrorOccurrence } from '@/entities/analytics/errors.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';

type ErrorOccurrencePanelProps = {
  dashboardId: string;
  fingerprint: string;
  totalCount: number;
};

export function ErrorOccurrencePanel({ dashboardId, fingerprint, totalCount }: ErrorOccurrencePanelProps) {
  const [offset, setOffset] = useState(0);
  const [occurrence, setOccurrence] = useState<ErrorOccurrence | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchErrorOccurrenceAction(dashboardId, fingerprint, 0);
      setOccurrence(data);
    });
  }, [dashboardId, fingerprint]);

  function navigate(newOffset: number) {
    setOffset(newOffset);
    startTransition(async () => {
      const data = await fetchErrorOccurrenceAction(dashboardId, fingerprint, newOffset);
      setOccurrence(data);
    });
  }

  const occurrenceNumber = totalCount - offset;
  const canGoNewer = offset > 0;
  const canGoOlder = offset < totalCount - 1;

  return (
    <Card className='gap-0 py-0'>
      {/* Occurrence navigator */}
      <div className='border-border bg-muted/30 flex items-center justify-between rounded-t-xl border-b px-4 py-2'>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate(offset + 1)}
            disabled={!canGoOlder || isPending}
            className='text-muted-foreground h-7 w-7'
            title='Older occurrence'
          >
            <ChevronLeft className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate(offset - 1)}
            disabled={!canGoNewer || isPending}
            className='text-muted-foreground h-7 w-7'
            title='Newer occurrence'
          >
            <ChevronRight className='h-3.5 w-3.5' />
          </Button>
          <span className='text-muted-foreground text-xs'>
            Occurrence <span className='text-foreground font-medium'>{occurrenceNumber}</span> of {totalCount}
          </span>
        </div>
        {occurrence && (
          <div className='flex min-w-0 items-center gap-3 text-xs'>
            {occurrence.url && (
              <span className='text-muted-foreground truncate'>{occurrence.url}</span>
            )}
            <span className='text-muted-foreground shrink-0'>
              {formatLocalDateTime(occurrence.timestamp, undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        )}
      </div>

      <CardContent className='space-y-6 px-6 py-6'>
        {!occurrence || isPending ? (
          <OccurrenceSkeleton />
        ) : (
          <>
            <OccurrenceContext occurrence={occurrence} />
            {occurrence.frames.length > 0 && (
              <div className='border-border border-t pt-6'>
                <StacktraceView
                  errorType={occurrence.error_type}
                  errorMessage={occurrence.error_message}
                  frames={occurrence.frames}
                  mechanism={occurrence.mechanism}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OccurrenceContext({ occurrence }: { occurrence: ErrorOccurrence }) {
  const details = [
    {
      label: 'Browser',
      value: occurrence.browser || '—',
      icon: <BrowserIcon name={occurrence.browser} className='h-6 w-6' />,
    },
    {
      label: 'OS',
      value: occurrence.os || '—',
      icon: <OSIcon name={occurrence.os} className='h-6 w-6' />,
    },
    {
      label: 'Device',
      value: occurrence.device_type || '—',
      icon: occurrence.device_type
        ? <DeviceIcon type={occurrence.device_type} className='h-6 w-6' />
        : <Monitor className='text-muted-foreground h-6 w-6' />,
    },
    {
      label: 'Country',
      value: occurrence.country_code || '—',
      icon: occurrence.country_code
        ? <FlagIcon countryCode={occurrence.country_code as FlagIconProps['countryCode']} countryName={occurrence.country_code} className='h-6 w-6' />
        : <Monitor className='text-muted-foreground h-6 w-6' />,
    },
  ];

  return (
    <dl className='-mx-6 flex divide-x divide-border'>
      {details.map(({ label, value, icon }) => (
        <div key={label} className='flex min-w-0 flex-1 items-center gap-3 px-6 py-1'>
          <div className='bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'>
            {icon}
          </div>
          <div className='min-w-0'>
            <dt className='text-muted-foreground text-xs'>{label}</dt>
            <dd className='text-foreground mt-0.5 truncate text-sm font-semibold'>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

function OccurrenceSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='-mx-6 flex divide-x divide-border'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex min-w-0 flex-1 items-center gap-3 px-6 py-1'>
            <Skeleton className='h-11 w-11 rounded-xl' />
            <div className='space-y-1.5'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        ))}
      </div>
      <div className='border-border space-y-2 border-t pt-6'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-32 w-full rounded-lg' />
      </div>
    </div>
  );
}
