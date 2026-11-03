'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useDashboardAlerts } from '@/hooks/use-dashboard-alerts';

function AlertDot({ className }: { className?: string }) {
  const t = useTranslations('dashboard.sidebar');
  return (
    <span className={cn('bg-destructive size-2 shrink-0 rounded-full', className)}>
      <span className='sr-only'>{t('monitorsDown')}</span>
    </span>
  );
}

type SidebarAlertDotProps = {
  /** At the end of the row in the expanded sidebar, on the icon in the collapsed one. */
  placement: 'end' | 'icon';
};

/** Red dot on the Monitoring item while a monitor is down. */
export function SidebarAlertDot({ placement }: SidebarAlertDotProps) {
  const alerts = useDashboardAlerts();
  if (!alerts?.hasDownMonitors) return null;

  return (
    <AlertDot
      className={
        placement === 'end'
          ? 'group-data-[collapsible=icon]:hidden'
          : 'ring-sidebar absolute -top-0.5 -right-0.5 hidden ring-2 group-data-[collapsible=icon]:block'
      }
    />
  );
}

/** The same dot for wherever the Monitoring item is out of sight (a folded group, the closed mobile menu). */
export function SidebarAlertSummaryDot({ className }: { className?: string }) {
  const alerts = useDashboardAlerts();
  if (!alerts?.hasDownMonitors) return null;
  return <AlertDot className={className} />;
}
