'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useDashboardAlerts } from '@/hooks/use-dashboard-alerts';

type SidebarAlertDotProps = {
  kind: 'monitoring' | 'statusPages';
};

/** Dot on the sidebar icon, red for down monitors and neutral for unresolved status page incidents. */
export function SidebarAlertDot({ kind }: SidebarAlertDotProps) {
  const t = useTranslations('dashboard.sidebar');
  const alerts = useDashboardAlerts();
  const active = (kind === 'monitoring' ? alerts?.downMonitors : alerts?.statusPageIncidents)?.length;
  if (!active) return null;

  return (
    <span
      className={cn(
        'ring-sidebar absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2',
        kind === 'monitoring' ? 'bg-destructive' : 'bg-muted-foreground',
      )}
    >
      <span className='sr-only'>{kind === 'monitoring' ? t('monitorsDown') : t('activeIncidents')}</span>
    </span>
  );
}
