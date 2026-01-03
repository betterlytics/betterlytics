'use client';

import { Filter, type LucideIcon } from 'lucide-react';

type FilterSelectValueProps = {
  label: string;
  Icon?: LucideIcon;
};

export function FilterSelectValue({ label, Icon = Filter }: FilterSelectValueProps) {
  return (
    <div className='flex items-center gap-1 overflow-hidden'>
      <Icon className='h-3.5 w-3.5 shrink-0 opacity-60' />
      <span className='truncate text-xs'>{label}</span>
    </div>
  );
}
