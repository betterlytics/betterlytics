'use client';

import React from 'react';
import { AnimatedDashboardLogo } from '@/components/loading/AnimatedDashboardLogo';

interface BetterlyticsLoadingProps {
  title: string;
  description: string;
  className?: string;
}

export default function BetterlyticsLoading({ title, description, className = '' }: BetterlyticsLoadingProps) {
  return (
    <div className={`bg-background flex h-full w-full items-center justify-center ${className}`}>
      <div className='text-center'>
        <div className='mb-6 flex justify-center'>
          <AnimatedDashboardLogo size={80} />
        </div>
        <h2 className='text-foreground mb-2 text-lg font-semibold'>{title}</h2>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
    </div>
  );
}
