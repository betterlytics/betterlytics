'use client';

import React from 'react';
import { AnimatedDashboardLogo } from '@/components/loading/AnimatedDashboardLogo';
import { cn } from '@/lib/utils';

interface BetterlyticsLogoLoadingProps {
  title: string;
  description: string;
  className?: string;
}

export default function BetterlyticsLogoLoading({ title, description, className }: BetterlyticsLogoLoadingProps) {
  return (
    <div className={cn('bg-background flex h-full w-full items-center justify-center', className)}>
      <div className='flex flex-col items-center'>
        <AnimatedDashboardLogo size={80} className='mb-6' />
        <h2 className='text-foreground mb-2 text-lg font-semibold'>{title}</h2>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
    </div>
  );
}
