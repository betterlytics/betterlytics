import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

// --sidebar-offset is the width the sidebar takes from the viewport, so fixed content can start where it ends
export default function BASidebarProvider({ className, ...props }: ComponentProps<typeof SidebarProvider>) {
  return (
    <SidebarProvider
      className={cn(
        '[--sidebar-offset:0px] md:has-[[data-slot=sidebar][data-state=collapsed]]:[--sidebar-offset:var(--sidebar-width-icon)] md:has-[[data-slot=sidebar][data-state=expanded]]:[--sidebar-offset:var(--sidebar-width)]',
        className,
      )}
      {...props}
    />
  );
}
