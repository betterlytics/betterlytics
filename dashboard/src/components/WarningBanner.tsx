import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type WarningBannerProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function WarningBanner({ title, description, className }: WarningBannerProps) {
  return (
    <div
      role='status'
      className={cn(
        'flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950',
        className,
      )}
    >
      <AlertCircle className='h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400' />
      <div className='flex-1'>
        <p className='text-sm font-medium text-orange-800 dark:text-orange-200'>{title}</p>
        {description && <p className='text-xs text-orange-700 dark:text-orange-300'>{description}</p>}
      </div>
    </div>
  );
}
