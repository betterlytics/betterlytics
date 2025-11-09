'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type DisabledTooltipProps = {
  disabled: boolean;
  message: string;
  children: (disabled: boolean) => React.ReactElement;
  wrapperClassName?: string;
};

/**
 * Usage notes
 * - Wrap with a stable DOM element when using inside Radix "asChild" triggers (e.g., PopoverTrigger).
 * - Reason: this component conditionally renders a Tooltip tree when disabled, which is not a DOM element.
 * - Example:
 *   <PopoverTrigger asChild>
 *     <span className="w-full">
 *       <DisabledTooltip disabled={...} message="...">
 *         {(isDisabled) => <Button disabled={isDisabled} />}
 *       </DisabledTooltip>
 *     </span>
 *   </PopoverTrigger>
 */
export function DisabledTooltip({ disabled, message, children, wrapperClassName }: DisabledTooltipProps) {
  if (!disabled) return children(false);

  return (
    <Tooltip delayDuration={300} disableHoverableContent>
      <TooltipTrigger asChild>
        <span className={wrapperClassName}>{children(true)}</span>
      </TooltipTrigger>
      <TooltipContent className='pointer-events-none'>{message}</TooltipContent>
    </Tooltip>
  );
}
