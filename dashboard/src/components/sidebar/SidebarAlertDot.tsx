'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useDashboardAlerts } from '@/hooks/use-dashboard-alerts';

export type SidebarAlertKind = 'monitoring' | 'statusPages';

function AlertDot({ kind, className }: { kind: SidebarAlertKind; className?: string }) {
  const t = useTranslations('dashboard.sidebar');
  return (
    <span
      className={cn(
        'size-2 shrink-0 rounded-full',
        kind === 'monitoring' ? 'bg-destructive' : 'dark:bg-muted-foreground bg-neutral-400',
        className,
      )}
    >
      <span className='sr-only'>{kind === 'monitoring' ? t('monitorsDown') : t('activeIncidents')}</span>
    </span>
  );
}

type SidebarAlertDotProps = {
  kind: SidebarAlertKind;
  /** At the end of the row in the expanded sidebar, on the icon in the collapsed one. */
  placement: 'end' | 'icon';
};

/** Red dot for down monitors, neutral dot for unresolved status page incidents. */
export function SidebarAlertDot({ kind, placement }: SidebarAlertDotProps) {
  const alerts = useDashboardAlerts();
  const active = kind === 'monitoring' ? alerts?.hasDownMonitors : alerts?.hasUnresolvedStatusPageIncidents;
  if (!active) return null;

  return (
    <AlertDot
      kind={kind}
      className={
        placement === 'end'
          ? 'group-data-[collapsible=icon]:hidden'
          : 'ring-sidebar absolute -top-0.5 -right-0.5 hidden ring-2 group-data-[collapsible=icon]:block'
      }
    />
  );
}

type SidebarAlertSummaryDotProps = {
  monitors: boolean;
  statusPages: boolean;
  className?: string;
};

/** One dot for wherever the item dots are out of sight (a folded group, the closed mobile menu); red wins over neutral. */
export function SidebarAlertSummaryDot({ monitors, statusPages, className }: SidebarAlertSummaryDotProps) {
  const alerts = useDashboardAlerts();
  if (monitors && alerts?.hasDownMonitors) return <AlertDot kind='monitoring' className={className} />;
  if (statusPages && alerts?.hasUnresolvedStatusPageIncidents)
    return <AlertDot kind='statusPages' className={className} />;
  return null;
}
