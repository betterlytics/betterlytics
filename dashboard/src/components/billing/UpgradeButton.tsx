'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

type UpgradeButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
};

export function UpgradeButton({ children, className, href = '/billing' }: UpgradeButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant='outline'
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
    </Link>
  );
}
