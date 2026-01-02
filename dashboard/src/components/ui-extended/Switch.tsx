'use client';

import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function Switch({ className, ...props }: ComponentProps<typeof ShadcnSwitch>) {
  return <ShadcnSwitch className={cn('cursor-pointer', className)} {...props} />;
}

export { Switch };
