'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type InfoTooltipDescriptionProps = {
  children: React.ReactNode;
  className?: string;
};

function InfoTooltipDescription({ children, className }: InfoTooltipDescriptionProps) {
  return <p className={cn('text-popover-foreground/90', className)}>{children}</p>;
}
InfoTooltipDescription.displayName = 'InfoTooltip.Description';

type InfoTooltipSecondaryProps = {
  children: React.ReactNode;
  className?: string;
};

function InfoTooltipSecondary({ children, className }: InfoTooltipSecondaryProps) {
  return (
    <>
      <Separator className='bg-popover-foreground/20' />
      <div className={className}>{children}</div>
    </>
  );
}
InfoTooltipSecondary.displayName = 'InfoTooltip.Secondary';

type InfoTooltipProps = {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  iconClassName?: string;
  triggerClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  ariaLabel?: string;
  maxWidth?: string;
  delayDuration?: number;
};

function InfoTooltip({
  children,
  trigger,
  iconClassName = 'h-4 w-4',
  triggerClassName,
  side = 'bottom',
  ariaLabel = 'More info',
  maxWidth = '260px',
  delayDuration = 250,
}: InfoTooltipProps) {
  const defaultTrigger = (
    <button
      type='button'
      aria-label={ariaLabel}
      className={cn('text-muted-foreground hover:text-foreground', triggerClassName)}
    >
      <Info className={iconClassName} />
    </button>
  );

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger ?? defaultTrigger}</TooltipTrigger>
        <TooltipContent side={side}>
          <div className='space-y-2' style={{ maxWidth }}>
            {children}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

InfoTooltip.Description = InfoTooltipDescription;
InfoTooltip.Secondary = InfoTooltipSecondary;

export { InfoTooltip };
