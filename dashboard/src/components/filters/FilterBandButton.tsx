'use client';
import { type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { cn } from '@/lib/utils';

type FilterBandButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  icon: ReactNode;
  tooltip: string;
};

export function FilterBandButton({ icon, tooltip, className, ...props }: FilterBandButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          title=''
          aria-label={tooltip}
          className={cn(
            'text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground dark:hover:bg-primary-foreground/15 size-8.5 shrink-0 cursor-pointer [&_svg]:size-4',
            className,
          )}
          {...props}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
