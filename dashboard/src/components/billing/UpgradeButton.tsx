'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';
import { useBillingFlow } from '@/contexts/BillingFlowProvider';

type UpgradeButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function UpgradeButton({ children, className }: UpgradeButtonProps) {
  const { openPlanPicker } = useBillingFlow();

  return (
    <Button
      variant='outline'
      onClick={openPlanPicker}
      className={cn(
        'cursor-pointer gap-2 whitespace-nowrap',
        'border-amber-500/30 text-amber-600 dark:text-amber-500',
        'hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400',
        className,
      )}
    >
      <Crown className='h-4 w-4' />
      {children}
    </Button>
  );
}
