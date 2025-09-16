import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  color?: 'green' | 'orange' | 'red' | 'blue';
  className?: string;
}

export function LiveIndicator({ color = 'green', className }: LiveIndicatorProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-500',
      shadow: 'shadow-green-500/50',
      ping: 'bg-green-400'
    },
    orange: {
      bg: 'bg-orange-500',
      shadow: 'shadow-orange-500/50',
      ping: 'bg-orange-400'
    },
    red: {
      bg: 'bg-red-500',
      shadow: 'shadow-red-500/50',
      ping: 'bg-red-400'
    },
    blue: {
      bg: 'bg-blue-500',
      shadow: 'shadow-blue-500/50',
      ping: 'bg-blue-400'
    }
  };

  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full shadow-lg',
        colors.bg,
        colors.shadow,
        className
      )}
    >
      <div className={cn('absolute inset-0 h-3 w-3 animate-ping rounded-full', colors.ping)} />
    </div>
  );
}
