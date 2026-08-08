import { useTranslations } from 'next-intl';
import { Badge, type BadgeAppearance, type BadgeIntent } from '@/components/v2/badge';
import type { PlanStatus } from '@/lib/billing/subscription-status';

const STATUS_BADGE: Record<PlanStatus, { intent: BadgeIntent; appearance: BadgeAppearance }> = {
  active: { intent: 'success', appearance: 'solid' },
  canceling: { intent: 'neutral', appearance: 'soft' },
  pastDue: { intent: 'danger', appearance: 'solid' },
  inactive: { intent: 'neutral', appearance: 'soft' },
};

export function PlanStatusBadge({ planStatus, className }: { planStatus: PlanStatus; className?: string }) {
  const t = useTranslations('components.billing.planStatus');
  const badge = STATUS_BADGE[planStatus];

  return (
    <Badge intent={badge.intent} appearance={badge.appearance} className={className}>
      {t(planStatus)}
    </Badge>
  );
}
