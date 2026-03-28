'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { OccurrenceSkeleton } from './OccurrenceSkeleton';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { OSIcon } from '@/components/icons/OSIcon';
import { FlagIcon, type FlagIconProps } from '@/components/icons/FlagIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { OccurrenceNavigator } from './OccurrenceNavigator';
import { StacktraceView } from './StacktraceView';
import { SessionTrail } from './SessionTrail';
import { fetchErrorOccurrenceAction } from '@/app/actions/analytics/errors.actions';
import type { ErrorOccurrence } from '@/entities/analytics/errors.entities';
import { getDeviceLabel } from '@/constants/deviceTypes';
import { useTranslations } from 'next-intl';

type ErrorOccurrencePanelProps = {
  dashboardId: string;
  fingerprint: string;
  totalCount: number;
};

export function ErrorOccurrencePanel({ dashboardId, fingerprint, totalCount }: ErrorOccurrencePanelProps) {
  const searchParams = useSearchParams();
  const occurrenceParam = searchParams.get('occurrence');
  const rawOffset = occurrenceParam ? totalCount - Number(occurrenceParam) : 0;
  const initialOffset = Math.max(0, Math.min(rawOffset, totalCount - 1));

  const [offset, setOffset] = useState(initialOffset);
  const [occurrence, setOccurrence] = useState<ErrorOccurrence | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (newOffset: number) => {
      const url = new URL(window.location.href);
      if (newOffset === 0) {
        url.searchParams.delete('occurrence');
      } else {
        url.searchParams.set('occurrence', String(totalCount - newOffset));
      }
      window.history.replaceState(null, '', url);
    },
    [totalCount],
  );

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchErrorOccurrenceAction(dashboardId, fingerprint, initialOffset);
      setOccurrence(data);
    });
  }, [dashboardId, fingerprint, initialOffset]);

  function navigate(newOffset: number) {
    setOffset(newOffset);
    updateUrl(newOffset);
    startTransition(async () => {
      const data = await fetchErrorOccurrenceAction(dashboardId, fingerprint, newOffset);
      setOccurrence(data);
    });
  }

  const occurrenceNumber = totalCount - offset;
  const canGoNewer = offset > 0;
  const canGoOlder = offset < totalCount - 1;

  return (
    <div className='space-y-4'>
      <Card className='gap-0 py-0'>
        <OccurrenceNavigator
          occurrence={occurrence}
          occurrenceNumber={occurrenceNumber}
          totalCount={totalCount}
          canGoOlder={canGoOlder}
          canGoNewer={canGoNewer}
          isPending={isPending}
          onNavigate={navigate}
          currentOffset={offset}
        />

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
              {occurrence.session_id && (
                <div className='border-border border-t pt-6'>
                  <SessionTrail
                    dashboardId={dashboardId}
                    sessionId={occurrence.session_id}
                    currentFingerprint={fingerprint}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OccurrenceContext({ occurrence }: { occurrence: ErrorOccurrence }) {
  const t = useTranslations('errors.detail.occurrence');
  const details = [
    {
      label: t('browser'),
      value: occurrence.browser || '—',
      icon: <BrowserIcon name={occurrence.browser} className='h-6 w-6' />,
    },
    {
      label: t('operatingSystem'),
      value: occurrence.os || '—',
      icon: <OSIcon name={occurrence.os} className='h-6 w-6' />,
    },
    {
      label: t('device'),
      value: occurrence.device_type ? getDeviceLabel(occurrence.device_type) : '—',
      icon: <DeviceIcon type={occurrence.device_type || 'unknown'} className='h-6 w-6' />,
    },
    {
      label: t('country'),
      value: occurrence.country_code || '—',
      icon: (
        <FlagIcon
          countryCode={occurrence.country_code as FlagIconProps['countryCode']}
          countryName={occurrence.country_code}
          className='h-6 w-6'
        />
      ),
    },
  ];

  return (
    <dl className='divide-border -mx-6 grid grid-cols-2 divide-x sm:grid-cols-4'>
      {details.map(({ label, value, icon }) => (
        <div key={label} className='flex min-w-0 items-center gap-3 px-6 py-1'>
          <div className='bg-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'>{icon}</div>
          <div className='min-w-0'>
            <dt className='text-muted-foreground text-xs'>{label}</dt>
            <dd className='text-foreground mt-0.5 truncate text-sm font-semibold'>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
