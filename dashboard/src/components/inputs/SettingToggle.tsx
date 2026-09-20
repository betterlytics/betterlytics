'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type SettingToggleProps = {
  id: string;
  label: ReactNode;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  children?: ReactNode;
};

export function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  disabledTooltip,
  children,
}: SettingToggleProps) {
  const toggle = <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />;

  return (
    <>
      <div className='space-y-1'>
        <div className='flex items-center justify-between gap-4'>
          <Label htmlFor={id} className={cn('text-sm font-medium', disabled && 'opacity-50')}>
            {label}
          </Label>
          {disabled && disabledTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='cursor-not-allowed'>{toggle}</span>
              </TooltipTrigger>
              <TooltipContent side='top' className='max-w-[220px]'>
                {disabledTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            toggle
          )}
        </div>
        {description && (
          <p className={cn('text-muted-foreground text-xs', disabled && 'opacity-50')}>{description}</p>
        )}
      </div>
      {children}
    </>
  );
}
