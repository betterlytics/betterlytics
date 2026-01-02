import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('space-y-layout-xl container p-2 pt-4 sm:p-6', className)}>{children}</div>;
}
