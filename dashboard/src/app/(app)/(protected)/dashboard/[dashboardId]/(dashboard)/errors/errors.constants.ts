import type { ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import type { BadgeIntent } from '@/components/v2/badge';

export const STATUS_CONFIG: Record<ErrorGroupStatusValue, BadgeIntent> = {
  unresolved: 'danger',
  resolved: 'success',
  ignored: 'neutral',
};
