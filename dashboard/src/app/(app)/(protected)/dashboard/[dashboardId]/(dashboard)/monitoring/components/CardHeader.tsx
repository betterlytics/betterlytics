'use client';

import { type ReactNode } from 'react';

type CardHeaderProps = {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function CardHeader({ title, badge, actions }: CardHeaderProps) {
  return (
    <div className='flex items-center justify-between gap-2'>
      <p className='text-muted-foreground text-sm font-semibold tracking-wide'>{title}</p>
      <div className='flex items-center gap-2'>
        {actions}
        {badge}
      </div>
    </div>
  );
}
