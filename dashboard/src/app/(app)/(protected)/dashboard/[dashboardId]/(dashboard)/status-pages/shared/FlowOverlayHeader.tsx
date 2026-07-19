'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type FlowOverlayHeaderProps = {
  title: ReactNode;
  closeAriaLabel: string;
  onClose: () => void;
  actions?: ReactNode;
};

export function FlowOverlayHeader({ title, closeAriaLabel, onClose, actions }: FlowOverlayHeaderProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <header className='border-border flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6'>
      <div className='-ml-2 flex min-w-0 items-center'>
        <button
          type='button'
          onClick={onClose}
          aria-label={closeAriaLabel}
          className='text-muted-foreground hover:text-foreground hover:bg-accent flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-md transition-colors'
        >
          <X className='h-4 w-4' />
        </button>
        <span className='bg-border ml-2 h-5 w-px flex-none' aria-hidden />
        <span className='ml-4 truncate text-sm font-semibold'>{title}</span>
      </div>
      <div className='flex flex-none items-center gap-2'>{actions}</div>
    </header>
  );
}
