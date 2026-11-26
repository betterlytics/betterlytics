'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlanDefinition } from '@/lib/billing/catalog';
import { Crown } from 'lucide-react';

type PlanBadgeProps = {
  plan: PlanDefinition | null;
  className?: string;
  showIcon?: boolean;
};

export function PlanBadge({ plan, className, showIcon = true }: PlanBadgeProps) {
  if (!plan) return null;

  return (
    <Badge
      variant='outline'
      className={cn(
        'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15',
        'border-amber-500/40 text-amber-600 dark:border-amber-400/40 dark:text-amber-400',
        'h-5 gap-0.5 px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase',
        'shadow-[0_0_8px_rgba(251,191,36,0.15)]',
        className,
      )}
    >
      {showIcon && <Crown className='h-2.5 w-2.5' />}
      {plan.name}
    </Badge>
  );
}
