'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useDashboardAlerts } from '@/hooks/use-dashboard-alerts';

export type SidebarAlertKind = 'monitoring' | 'statusPages';

type SidebarAlertDotProps = {
  kind: SidebarAlertKind;
  /** At the end of the row in the expanded sidebar, on the icon in the collapsed one. */
  placement: 'end' | 'icon';
};

/** Red dot for down monitors, neutral dot for unresolved status page incidents. */
export function SidebarAlertDot({ kind, placement }: SidebarAlertDotProps) {
  const t = useTranslations('dashboard.sidebar');
  const alerts = useDashboardAlerts();
  const active = kind === 'monitoring' ? alerts?.hasDownMonitors : alerts?.hasUnresolvedStatusPageIncidents;
  if (!active) return null;

  return (
    <span
      className={cn(
        'size-2 shrink-0 rounded-full',
        kind === 'monitoring' ? 'bg-destructive' : 'bg-muted-foreground',
        placement === 'end'
          ? 'group-data-[collapsible=icon]:hidden'
          : 'ring-sidebar absolute -top-0.5 -right-0.5 hidden ring-2 group-data-[collapsible=icon]:block',
      )}
    >
      <span className='sr-only'>{kind === 'monitoring' ? t('monitorsDown') : t('activeIncidents')}</span>
    </span>
  );
}
