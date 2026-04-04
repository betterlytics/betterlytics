'use client';

import { Dispatch, ReactNode, useEffect, useRef, useState } from 'react';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { Skeleton } from '../ui/skeleton';
import { ScrollIndicators } from '../scroll-indicators';
import { CheckIcon } from 'lucide-react';

const SUB_CLOSE_DELAY_MS = 300;

type QueryFilterInputSubMenuProps = {
  label: ReactNode;
  icon?: ReactNode;
  items: { key: string; label: string }[];
  activeKey?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onSelect: Dispatch<string>;
};

export function QueryFilterInputSubMenu({
  label,
  icon,
  items,
  activeKey,
  isLoading,
  disabled,
  onSelect,
}: QueryFilterInputSubMenuProps) {
  const t = useTranslations('components.demoMode');
  const [subOpen, setSubOpen] = useState(false);
  const subCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tFilters = useTranslations('components.filters');
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    return () => {
      if (subCloseTimer.current) clearTimeout(subCloseTimer.current);
    };
  }, []);

  function scheduleSubClose() {
    if (isTouch) return;
    subCloseTimer.current = setTimeout(() => setSubOpen(false), SUB_CLOSE_DELAY_MS);
  }

  function cancelSubClose() {
    if (subCloseTimer.current) {
      clearTimeout(subCloseTimer.current);
      subCloseTimer.current = null;
    }
  }

  if (disabled) {
    return (
      <DropdownMenuItem disabled>
        {icon}
        {label}
        <span className='text-muted-foreground ml-auto text-xs'>{t('notAvailable')}</span>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuSub open={subOpen} onOpenChange={setSubOpen}>
      <DropdownMenuSubTrigger
        className='[&_svg:not([class*="text-"])]:text-muted-foreground gap-2'
        onPointerEnter={cancelSubClose}
        onPointerLeave={scheduleSubClose}
        onClick={() => {
          if (subOpen) setSubOpen(false);
        }}
      >
        {icon}
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        onPointerEnter={cancelSubClose}
        onPointerLeave={scheduleSubClose}
        collisionPadding={16}
        sticky='always'
      >
        {isLoading ? (
          <div className='space-y-1 p-1'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-7 w-full rounded-sm' />
            ))}
          </div>
        ) : items.length > 0 ? (
          <ScrollIndicators
            className='max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))]'
            scrollToKey={activeKey}
          >
            {items.map((item) => (
              <DropdownMenuItem key={item.key} data-scroll-key={item.key} onSelect={() => onSelect(item.key)}>
                {item.label}
                {item.key === activeKey && <CheckIcon className='ml-auto size-4' />}
              </DropdownMenuItem>
            ))}
          </ScrollIndicators>
        ) : (
          <DropdownMenuItem disabled>{tFilters('noProperties')}</DropdownMenuItem>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
