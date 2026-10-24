'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDashboardAlerts } from '@/hooks/use-dashboard-alerts';

type SidebarAlertBadgeProps = {
  kind: 'monitoring' | 'statusPages';
};

export function SidebarAlertBadge({ kind }: SidebarAlertBadgeProps) {
  const t = useTranslations('dashboard.sidebar');
  const alerts = useDashboardAlerts();
  const count = (kind === 'monitoring' ? alerts?.downMonitors : alerts?.statusPageIncidents)?.length ?? 0;
  if (count === 0) return null;

  return (
    <Badge
      variant={kind === 'monitoring' ? 'destructive' : 'secondary'}
      className={cn(
        'h-5 min-w-5 rounded-full px-1.5 tabular-nums group-data-[collapsible=icon]:hidden',
        kind === 'monitoring' && 'dark:bg-destructive',
      )}
      aria-label={kind === 'monitoring' ? t('downMonitorsCount', { count }) : t('activeIncidentsCount', { count })}
    >
      {count}
    </Badge>
  );
}

/** Red dot on the Monitoring icon, shown only while the sidebar is collapsed to icons. */
export function SidebarDownDot() {
  const alerts = useDashboardAlerts();
  if (!alerts?.downMonitors.length) return null;

  return (
    <span
      aria-hidden
      className='bg-destructive absolute -top-0.5 -right-0.5 hidden size-2 rounded-full group-data-[collapsible=icon]:block'
    />
  );
}
