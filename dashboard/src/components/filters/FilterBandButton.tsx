'use client';
import { type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { cn } from '@/lib/utils';

type FilterBandButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  icon: ReactNode;
  // Without one the button relies on its own title
  tooltip?: string;
};

export function FilterBandButton({ icon, tooltip, className, ...props }: FilterBandButtonProps) {
  const button = (
    <Button
      variant='ghost'
      title={tooltip && ''}
      aria-label={tooltip}
      className={cn(
        'text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground dark:hover:bg-primary-foreground/15 size-8.5 shrink-0 cursor-pointer [--ring:var(--primary-foreground)] [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {icon}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
