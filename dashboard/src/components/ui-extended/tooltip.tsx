'use client';

import * as React from 'react';
import {
  TooltipProvider as ShadcnTooltipProvider,
  Tooltip as ShadcnTooltip,
  TooltipTrigger as ShadcnTooltipTrigger,
  TooltipContent as ShadcnTooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = ShadcnTooltipProvider;
const Tooltip = ShadcnTooltip;
const TooltipTrigger = ShadcnTooltipTrigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof ShadcnTooltipContent>,
  React.ComponentPropsWithoutRef<typeof ShadcnTooltipContent>
>(({ className, ...props }, ref) => (
  <ShadcnTooltipContent
    ref={ref}
    className={cn(
      'border-border bg-popover/95 text-popover-foreground rounded-lg border p-2.5 shadow-xl backdrop-blur-sm',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
