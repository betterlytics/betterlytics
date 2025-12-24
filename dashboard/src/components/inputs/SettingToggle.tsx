'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ReactNode } from 'react';

type SettingToggleProps = {
  id: string;
  label: string;
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
          <Label htmlFor={id} className='text-sm font-medium'>
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
        {description && <p className='text-muted-foreground text-xs'>{description}</p>}
      </div>
      {children}
    </>
  );
}
