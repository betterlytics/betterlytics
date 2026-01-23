'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type CollapsibleSidebarGroupProps = {
  label: string;
  storageKey: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSidebarGroup({
  label,
  storageKey,
  children,
  defaultOpen = true,
}: CollapsibleSidebarGroupProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
    setIsHydrated(true);
  }, [storageKey]);

  React.useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(storageKey, String(isOpen));
    }
  }, [isOpen, storageKey, isHydrated]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className='group/collapsible'>
      <SidebarGroup className='py-0'>
        <CollapsibleTrigger className='text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors'>
          <span>{label}</span>
          <ChevronRight
            className={cn('size-3.5 shrink-0 transition-transform duration-200', isOpen && 'rotate-90')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
          <SidebarGroupContent className='pt-1'>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
