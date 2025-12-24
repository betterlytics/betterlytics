import { cn } from '@/lib/utils';

export type LiveIndicatorColor = 'green' | 'orange' | 'red' | 'blue' | 'grey';

interface LiveIndicatorProps {
  color?: LiveIndicatorColor;
  positionClassName?: string;
  sizeClassName?: string;
  pulse?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function LiveIndicator({
  color = 'green',
  positionClassName = 'absolute -top-1 -right-1',
  sizeClassName = 'h-3 w-3',
  pulse = true,
  className,
  'aria-label': ariaLabel,
}: LiveIndicatorProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-500',
      shadow: 'shadow-green-500/50',
      ping: 'bg-green-400',
    },
    orange: {
      bg: 'bg-orange-500',
      shadow: 'shadow-orange-500/50',
      ping: 'bg-orange-400',
    },
    red: {
      bg: 'bg-red-500',
      shadow: 'shadow-red-500/50',
      ping: 'bg-red-400',
    },
    blue: {
      bg: 'bg-blue-500',
      shadow: 'shadow-blue-500/50',
      ping: 'bg-blue-400',
    },
    grey: {
      bg: 'bg-slate-400',
      shadow: 'shadow-slate-400/40',
      ping: 'bg-slate-300',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn('relative', positionClassName, sizeClassName, className)} aria-label={ariaLabel}>
      <div
        className={cn(
          'absolute inset-0 rounded-full shadow-lg',
          pulse && 'animate-pulse',
          sizeClassName,
          colors.bg,
          colors.shadow,
        )}
      />
      {pulse ? (
        <div className={cn('absolute inset-0 animate-ping rounded-full', sizeClassName, colors.ping)} />
      ) : null}
    </div>
  );
}
