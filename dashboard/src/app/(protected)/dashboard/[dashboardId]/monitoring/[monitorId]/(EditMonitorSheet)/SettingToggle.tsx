'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { ReactNode } from 'react';

type SettingToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
};

export function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  children,
}: SettingToggleProps) {
  return (
    <>
      <div className='space-y-1'>
        <div className='flex items-center justify-between gap-4'>
          <Label htmlFor={id} className='text-sm font-medium'>
            {label}
          </Label>
          <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </div>
        {description && <p className='text-muted-foreground text-xs'>{description}</p>}
      </div>
      {children}
    </>
  );
}
