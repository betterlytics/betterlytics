import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type InsetPanelProps = {
  children: ReactNode;
  className?: string;
};

export function InsetPanel({ children, className }: InsetPanelProps) {
  return <div className={cn('border-border/60 bg-muted/40 rounded-md border', className)}>{children}</div>;
}
