'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StepProps {
  stepNumber: number;
  title: string;
  badge?: string;
  isLast?: boolean;
  children: React.ReactNode;
}

export function Step({ stepNumber, title, badge, isLast = false, children }: StepProps) {
  return (
    <div className='relative flex gap-4'>
      {/* Circle and Line */}
      <div className='flex flex-col items-center'>
        <div className='bg-muted border-border text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium'>
          {stepNumber}
        </div>
        {!isLast && <div className='bg-border mt-2 w-px flex-1' />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
        <div className='mb-2 flex items-center gap-2'>
          <h4 className='text-foreground text-sm font-medium'>{title}</h4>
          {badge && (
            <span className='text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[10px] font-medium'>
              {badge}
            </span>
          )}
        </div>
        <div className='text-muted-foreground text-sm'>{children}</div>
      </div>
    </div>
  );
}

interface StepContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StepContainer({ children, className }: StepContainerProps) {
  return <div className={cn('space-y-0', className)}>{children}</div>;
}

// Helper to render markdown-style text (bold and code)
export function StepText({ children }: { children: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: children
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
          .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>'),
      }}
    />
  );
}
