'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

function UnderlineTabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot='underline-tabs' className={cn('flex flex-col', className)} {...props} />;
}

function UnderlineTabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot='underline-tabs-list'
      className={cn('border-border inline-flex items-center gap-4 border-b', className)}
      {...props}
    />
  );
}

function UnderlineTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot='underline-tabs-trigger'
      className={cn(
        'text-muted-foreground relative cursor-pointer pb-2 text-sm font-medium transition-colors',
        'hover:text-foreground',
        'data-[state=active]:text-foreground',
        'after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5',
        'after:bg-primary after:scale-x-0 after:transition-transform after:duration-200',
        'data-[state=active]:after:scale-x-100',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function UnderlineTabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot='underline-tabs-content'
      className={cn('flex-1 pt-3 outline-none', className)}
      {...props}
    />
  );
}

export { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger, UnderlineTabsContent };
