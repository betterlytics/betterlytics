'use client';

import { Button as ShadcnButton, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function Button({ className, ...props }: ComponentProps<typeof ShadcnButton>) {
  return <ShadcnButton className={cn('cursor-pointer', className)} {...props} />;
}

export { Button, buttonVariants };
