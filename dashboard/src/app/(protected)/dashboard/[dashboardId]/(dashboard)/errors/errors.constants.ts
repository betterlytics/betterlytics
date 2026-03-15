import type { ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';

export const STATUS_CONFIG: Record<ErrorGroupStatusValue, { label: string; className: string }> = {
  unresolved: {
    label: 'Unresolved',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  },
  ignored: {
    label: 'Ignored',
    className: 'bg-muted text-muted-foreground border-border',
  },
};
