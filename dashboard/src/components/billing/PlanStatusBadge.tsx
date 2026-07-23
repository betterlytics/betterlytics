import { useTranslations } from 'next-intl';
import type { VariantProps } from 'class-variance-authority';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlanStatus } from '@/lib/billing/subscription-status';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const STATUS_BADGE: Record<PlanStatus, { variant: BadgeVariant; className?: string }> = {
  active: { variant: 'default', className: 'border-transparent bg-emerald-600 text-white dark:bg-emerald-800' },
  canceling: { variant: 'secondary' },
  pastDue: { variant: 'destructive' },
  inactive: { variant: 'secondary' },
};

export function PlanStatusBadge({ planStatus, className }: { planStatus: PlanStatus; className?: string }) {
  const t = useTranslations('components.billing.planStatus');
  const badge = STATUS_BADGE[planStatus];

  return (
    <Badge variant={badge.variant} className={cn(badge.className, className)}>
      {t(planStatus)}
    </Badge>
  );
}
