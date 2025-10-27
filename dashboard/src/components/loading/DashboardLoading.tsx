import React from 'react';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLoading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={'bg-background flex min-h-screen items-center justify-center'}>
      <div className='text-center'>
        <div className='mb-4 flex justify-center'>
          <Spinner size='lg' />
        </div>
        <h2 className='text-foreground mb-2 text-lg font-semibold'>{title}</h2>
        {subtitle && <p className='text-muted-foreground text-sm'>{subtitle}</p>}
      </div>
    </div>
  );
}
