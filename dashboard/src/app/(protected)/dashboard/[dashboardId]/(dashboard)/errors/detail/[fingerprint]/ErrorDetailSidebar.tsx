import { Card, CardContent } from '@/components/ui/card';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { EnvironmentDistribution } from './EnvironmentDistribution';
import { ErrorVolumeChart } from './ErrorVolumeChart';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';
import type { ErrorGroupSidebarData } from '@/services/analytics/errors.service';
import { formatRelativeTimeFromNow } from '@/utils/dateFormatters';

type ErrorDetailSidebarProps = {
  errorGroup: ErrorGroupRow;
  sidebarData: ErrorGroupSidebarData;
};

export function ErrorDetailSidebar({ errorGroup, sidebarData }: ErrorDetailSidebarProps) {
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
            <p className='text-foreground text-sm font-medium'>Activity</p>
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
    </aside>
  );
}
