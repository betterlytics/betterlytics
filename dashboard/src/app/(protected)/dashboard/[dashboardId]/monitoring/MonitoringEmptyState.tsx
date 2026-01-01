'use client';

import { useTranslations } from 'next-intl';
import { CreateMonitorDialog } from './CreateMonitorDialog';
import { Card } from '@/components/ui/card';
import { LiveIndicator } from '@/components/live-indicator';
import { RefreshCcw } from 'lucide-react';
import { Description, Caption } from '@/components/text';

type MonitoringEmptyStateProps = {
  dashboardId: string;
  domain: string;
};

// Values: 1 = up, 0.5 = degraded, 0 = no data, -1 = down
const PILL_PATTERNS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const MOCK_MONITOR_TEMPLATES = [
  { prefix: 'api.', uptime: '99.98%', duration: 14, interval: 1, pattern: 0 },
  { prefix: 'app.', uptime: '99.94%', duration: 7, interval: 5, pattern: 1 },
  { prefix: '', uptime: '100%', duration: 30, interval: 1, pattern: 2 },
];

type MockMonitor = {
  name: string;
  uptime: string;
  duration: string;
  interval: string;
  pattern: number;
};

function SkeletonMonitorRow({ monitor }: { monitor: MockMonitor }) {
  const pillData = PILL_PATTERNS[monitor.pattern];
  const tStatus = useTranslations('monitoring.status');

  return (
    <Card className='border-border/40 bg-card/50 relative overflow-hidden px-4 py-3'>
      <div
        className='absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b from-emerald-500 to-emerald-600'
        aria-hidden
      />

      <div className='flex items-center gap-4'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <LiveIndicator color='green' positionClassName='relative' sizeClassName='h-2.5 w-2.5' />
          <div className='min-w-0'>
            <div className='text-foreground/80 truncate text-sm font-medium'>{monitor.name}</div>
            <Caption className='opacity-60'>
              {tStatus('up')} {monitor.duration}
            </Caption>
          </div>
        </div>

        <div className='hidden items-center gap-4 sm:flex'>
          <div className='text-muted-foreground/50 flex items-center gap-1 text-xs whitespace-nowrap'>
            <RefreshCcw size={12} />
            <span>{monitor.interval}</span>
          </div>

          <div className='w-32 lg:w-48'>
            <div className='border-border/30 bg-background/20 flex gap-[3px] rounded-md border p-1.5'>
              {pillData.map((value, i) => {
                let bgClass = 'bg-emerald-500/70';
                if (value < 0) bgClass = 'bg-red-500/70';
                else if (value === 0) bgClass = 'bg-muted-foreground/20';
                else if (value < 1) bgClass = 'bg-amber-500/70';

                return <span key={i} className={`h-4 flex-1 rounded-sm ${bgClass}`} />;
              })}
            </div>
          </div>

          <span className='w-14 text-right text-xs font-medium whitespace-nowrap text-emerald-500/80'>
            {monitor.uptime}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function MonitoringEmptyState({ dashboardId, domain }: MonitoringEmptyStateProps) {
  const t = useTranslations('monitoringPage.emptyState');
  const tList = useTranslations('monitoringPage.list');

  return (
    <div className='relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-4 pt-14 pb-4 sm:justify-center sm:py-4'>
      <div className='pointer-events-none absolute inset-0' aria-hidden>
        <div className='bg-primary/5 absolute top-1/3 left-0 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl' />
        <div className='absolute right-0 bottom-1/3 h-40 w-40 translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl' />
      </div>

      <div className='relative flex flex-1 flex-col justify-center space-y-6 sm:order-2 sm:flex-none sm:pt-8'>
        <div className='space-y-3 text-center'>
          <h2 className='text-2xl font-semibold tracking-tight'>{t('title')}</h2>
          <Description className='mx-auto max-w-md leading-relaxed'>{t('description')}</Description>
        </div>
        <div className='flex justify-center'>
          <CreateMonitorDialog dashboardId={dashboardId} domain={domain} existingUrls={[]} />
        </div>
      </div>

      <div className='relative mt-auto w-full space-y-2 opacity-60 sm:order-1 sm:mt-0'>
        {MOCK_MONITOR_TEMPLATES.map((template) => {
          const monitor: MockMonitor = {
            name: `${template.prefix}${domain}`,
            uptime: template.uptime,
            duration: t('durationDays', { value: template.duration }),
            interval: tList('intervalMinutes', { value: template.interval }),
            pattern: template.pattern,
          };
          return <SkeletonMonitorRow key={monitor.name} monitor={monitor} />;
        })}
      </div>
    </div>
  );
}
