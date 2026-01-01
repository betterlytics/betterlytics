import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  /** Vertical spacing between children. Default: 4 */
  spacing?: 3 | 4 | 6;
};

export function PageContainer({ children, className, spacing = 4 }: PageContainerProps) {
  const spacingClasses = {
    3: 'space-y-3',
    4: 'space-y-4',
    6: 'space-y-6',
  };

  return <div className={cn('container p-2 pt-4 sm:p-6', spacingClasses[spacing], className)}>{children}</div>;
}
