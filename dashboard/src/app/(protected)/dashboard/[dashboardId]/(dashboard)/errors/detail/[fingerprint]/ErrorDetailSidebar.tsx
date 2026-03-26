import { VideoOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { BrowserIcon } from '@/components/icons/BrowserIcon';
import { DeviceIcon } from '@/components/icons/DeviceIcon';
import { EnvironmentDistribution } from './EnvironmentDistribution';
import { getDeviceLabel } from '@/constants/deviceTypes';
import { ErrorVolumeChart } from './ErrorVolumeChart';
import { ReplayCard } from './ReplayCard';
import type { ErrorGroupRow, ErrorGroupSidebarData } from '@/entities/analytics/errors.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';

function StatRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className='flex flex-col lg:flex-col xl:flex-row xl:justify-between xl:gap-2'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='text-sm font-semibold'>{value}</dd>
    </div>
  );
}

type ErrorDetailSidebarProps = {
  errorGroup: ErrorGroupRow;
  sidebarData: ErrorGroupSidebarData;
  replaySessionId: string | null;
};

export async function ErrorDetailSidebar({
  errorGroup,
  sidebarData,
  replaySessionId,
}: ErrorDetailSidebarProps) {
  const t = await getTranslations('errors.detail.sidebar');
  const { browsers, deviceTypes, dailyVolume } = sidebarData;

  const browserItems = browsers.map((row) => ({
    ...row,
    icon: <BrowserIcon name={row.label} className='h-4 w-4' />,
  }));

  const deviceTypeItems = deviceTypes.map((row) => ({
    ...row,
    label: getDeviceLabel(row.label),
    icon: <DeviceIcon type={row.label} className='h-4 w-4' />,
  }));

  return (
    <aside className='order-1 col-span-1 space-y-4 lg:order-none'>
      <Card>
        <CardContent className='space-y-4 px-6'>
          <div className='space-y-2'>
            <p className='text-foreground text-base font-medium'>{t('overview')}</p>
            <dl className='grid grid-cols-2 gap-x-6 gap-y-1.5 lg:grid-cols-1'>
              <StatRow
                label={t('firstSeen')}
                value={formatLocalDateTime(errorGroup.first_seen, undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
              <StatRow
                label={t('lastSeen')}
                value={formatLocalDateTime(errorGroup.last_seen, undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
              <StatRow label={t('occurrences')} value={errorGroup.count.toLocaleString()} />
              <StatRow label={t('sessions')} value={errorGroup.session_count.toLocaleString()} />
            </dl>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1'>
            {dailyVolume.length > 0 && (
              <div className='border-border space-y-2 border-t pt-2'>
                <p className='text-foreground text-base font-medium'>{t('occurrenceHistory')}</p>
                <ErrorVolumeChart data={dailyVolume} />
              </div>
            )}

            {browserItems.length > 0 && <EnvironmentDistribution title={t('browsers')} items={browserItems} />}

            {deviceTypeItems.length > 0 && <EnvironmentDistribution title={t('deviceType')} items={deviceTypeItems} />}
          </div>
        </CardContent>
      </Card>

      {replaySessionId ? (
        <ReplayCard replaySessionId={replaySessionId} />
      ) : (
        <Card className='hidden lg:block'>
          <CardContent className='px-4'>
            <div className='space-y-1.5'>
              <p className='text-foreground flex items-center gap-2 text-sm'>
                <VideoOff className='h-4 w-4 shrink-0' />
                {t('noReplay')}
              </p>
              <p className='text-muted-foreground text-xs'>
                {t('noReplayDescription')}
              </p>
              <a
                href='https://betterlytics.io/docs/dashboard/session-replay'
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-foreground inline-block text-xs underline underline-offset-2 transition-colors'
              >
                {t('learnMore')}
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  );
}
