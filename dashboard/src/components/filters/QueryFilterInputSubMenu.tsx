'use client';

import { Dispatch, ReactNode, useEffect, useRef, useState } from 'react';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';
import { useTranslations } from 'next-intl';

const SUB_CLOSE_DELAY_MS = 300;

type QueryFilterInputSubMenuProps = {
  label: ReactNode;
  icon?: ReactNode;
  items: { key: string; label: string }[];
  disabled?: boolean;
  onSelect: Dispatch<string>;
};

export function QueryFilterInputSubMenu({ label, icon, items, disabled, onSelect }: QueryFilterInputSubMenuProps) {
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

  return (
    <DropdownMenuSub open={subOpen} onOpenChange={setSubOpen}>
      <DropdownMenuSubTrigger
        disabled={disabled}
        className='[&_svg:not([class*="text-"])]:text-muted-foreground gap-2'
        onPointerEnter={cancelSubClose}
        onPointerLeave={scheduleSubClose}
      >
        {icon}
        {label}
        {disabled && <span className='text-muted-foreground ml-auto text-xs'>{t('notAvailable')}</span>}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent onPointerEnter={cancelSubClose} onPointerLeave={scheduleSubClose}>
        {items.length > 0 ? (
          items.map((item) => (
            <DropdownMenuItem key={item.key} onSelect={() => onSelect(item.key)}>
              {item.label}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>{tFilters('noProperties')}</DropdownMenuItem>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
