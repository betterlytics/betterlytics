import type { ReactNode } from 'react';
import { InView } from '@/landing/components/ui/inView';
import { cn } from '@/landing/lib/cn';

export function Stage({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <InView className={cn('relative isolate overflow-hidden bg-hatch', className)} aria-hidden data-nosnippet>
      {children}
    </InView>
  );
}
