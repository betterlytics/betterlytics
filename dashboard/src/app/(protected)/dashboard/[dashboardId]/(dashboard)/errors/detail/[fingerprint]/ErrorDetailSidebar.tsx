import Link from 'next/link';
import { MonitorPlay, Play, VideoOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { EnvironmentDistribution } from './EnvironmentDistribution';
import { ErrorVolumeChart } from './ErrorVolumeChart';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';
import type { ErrorGroupSidebarData } from '@/services/analytics/errors.service';
import { formatRelativeTimeFromNow } from '@/utils/dateFormatters';

type ErrorDetailSidebarProps = {
  dashboardId: string;
  errorGroup: ErrorGroupRow;
  sidebarData: ErrorGroupSidebarData;
  replaySessionId: string | null;
};

export function ErrorDetailSidebar({
  dashboardId,
  errorGroup,
  sidebarData,
  replaySessionId,
}: ErrorDetailSidebarProps) {
  const { browsers, deviceTypes, dailyVolume } = sidebarData;

  const browserItems = browsers.map((row) => ({
    ...row,
    icon: <BrowserIcon name={row.label} className='h-4 w-4' />,
  }));

  const deviceTypeItems = deviceTypes.map((row) => ({
    ...row,
    icon: <DeviceIcon type={row.label} className='h-4 w-4' />,
  }));

  return (
    <aside className='col-span-1 space-y-4'>
      <Card>
        <CardContent className='space-y-4 px-6'>
          <div className='space-y-2'>
            <p className='text-foreground text-sm font-medium'>Overview</p>
            <dl className='space-y-1.5'>
              {errorGroup.first_seen && (
                <div className='flex justify-between gap-2'>
                  <dt className='text-muted-foreground text-sm'>First seen</dt>
                  <dd className='text-sm font-medium'>{formatRelativeTimeFromNow(errorGroup.first_seen)}</dd>
                </div>
              )}
              <div className='flex justify-between gap-2'>
                <dt className='text-muted-foreground text-sm'>Last seen</dt>
                <dd className='text-sm font-medium'>{formatRelativeTimeFromNow(errorGroup.last_seen)}</dd>
              </div>
              <div className='flex justify-between gap-2'>
                <dt className='text-muted-foreground text-sm'>Occurrences</dt>
                <dd className='text-sm font-medium'>{errorGroup.count.toLocaleString()}</dd>
              </div>
              <div className='flex justify-between gap-2'>
                <dt className='text-muted-foreground text-sm'>Sessions</dt>
                <dd className='text-sm font-medium'>{errorGroup.session_count.toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {dailyVolume.length > 0 && (
            <div className='border-border space-y-2 border-t pt-2'>
              <p className='text-foreground text-sm font-medium'>Error volume</p>
              <ErrorVolumeChart data={dailyVolume} />
            </div>
          )}

          {browserItems.length > 0 && <EnvironmentDistribution title='Browsers' items={browserItems} />}

          {deviceTypeItems.length > 0 && <EnvironmentDistribution title='Device type' items={deviceTypeItems} />}
        </CardContent>
      </Card>

      {replaySessionId ? (
        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='px-4 py-3'>
            <Link
              href={`/dashboard/${dashboardId}/replay?sessionId=${replaySessionId}`}
              className='flex flex-col items-center gap-2 text-center'
            >
              <div className='bg-primary/15 flex h-8 w-8 items-center justify-center rounded-full'>
                <Play className='text-primary h-3.5 w-3.5 translate-x-[1px]' />
              </div>
              <div>
                <p className='text-sm font-medium'>Watch session replay</p>
                <p className='text-muted-foreground text-xs'>See what the user did before this error</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='px-4'>
            <div className='space-y-1.5'>
              <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                <VideoOff className='h-4 w-4 shrink-0' />
                No session replay for this error
              </p>
              <p className='text-muted-foreground/60 text-xs'>
                Replay captures what users did before an error occurred.
              </p>
              <a
                href='https://betterlytics.io/docs/dashboard/session-replay'
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground inline-block text-xs underline underline-offset-2 transition-colors'
              >
                Learn more
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  );
}
