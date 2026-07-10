import type { ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';

export const STATUS_CONFIG: Record<ErrorGroupStatusValue, { className: string }> = {
  unresolved: {
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  resolved: {
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  },
  ignored: {
    className: 'bg-muted text-muted-foreground border-border',
  },
};
