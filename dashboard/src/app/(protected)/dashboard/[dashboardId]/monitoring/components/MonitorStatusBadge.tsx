'use client';

import { Badge } from '@/components/ui/badge';
import { type MonitorPresentation } from '@/app/(protected)/dashboard/[dashboardId]/monitoring/monitoringStyles';
import { useTranslations } from 'next-intl';

type MonitorStatusBadgeProps = {
  presentation: MonitorPresentation;
  className?: string;
};

export function MonitorStatusBadge({ presentation, className }: MonitorStatusBadgeProps) {
  const tStatus = useTranslations('monitoring.status');
  const label = presentation.labelKey ? tStatus(presentation.labelKey) : presentation.label;
  const theme = presentation.theme;
  return (
    <Badge
      variant='secondary'
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${theme.badgeBorder} ${theme.badgeBg} ${theme.text} ${className ?? ''}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} aria-hidden />
      <span>{label}</span>
    </Badge>
  );
}
