'use client';

import { Info } from 'lucide-react';
import { TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

type InfoTooltipProps = {
  content: React.ReactNode;
  iconClassName?: string;
  triggerClassName?: string;
  ariaLabel?: string;
};

export default function InfoTooltip({
  content,
  iconClassName = 'h-4 w-4',
  triggerClassName,
  ariaLabel = 'More info',
}: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipTrigger asChild>
          <button
            type='button'
            aria-label={ariaLabel}
            className={triggerClassName || 'text-muted-foreground hover:text-foreground'}
          >
            <Info className={iconClassName} />
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          <div className='max-w-[260px] space-y-2'>{content}</div>
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}
