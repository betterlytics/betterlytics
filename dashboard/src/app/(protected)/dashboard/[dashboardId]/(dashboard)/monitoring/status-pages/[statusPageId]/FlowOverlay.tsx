'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type FlowOverlayProps = {
  title: ReactNode;
  closeAriaLabel: string;
  onClose: () => void;
  /** Optional centered content (like a stepper for the create wizard) */
  center?: ReactNode;
  /** Right-aligned actions (Back / Continue, or Cancel / Save). */
  actions?: ReactNode;
  /** Body wrapper classes. Defaults to a single scrolling column; override for a split layout. */
  bodyClassName?: string;
  children: ReactNode;
};

export function FlowOverlay({
  title,
  closeAriaLabel,
  onClose,
  center,
  actions,
  bodyClassName = 'flex-1 overflow-y-auto',
  children,
}: FlowOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className='bg-background animate-in fade-in-0 fixed inset-0 z-50 flex flex-col duration-150'>
      <header className='border-border grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b px-4 py-3 sm:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <button
            type='button'
            onClick={onClose}
            aria-label={closeAriaLabel}
            className='border-border text-muted-foreground hover:text-foreground hover:bg-accent flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-md border transition-colors'
          >
            <X className='h-4 w-4' />
          </button>
          <span className='truncate text-sm font-semibold'>{title}</span>
        </div>
        {/* Always render the middle grid cell so the right column stays put; the stepper hides on small screens. */}
        <div>{center ? <div className='hidden lg:block'>{center}</div> : null}</div>
        <div className='flex items-center gap-2 justify-self-end'>{actions}</div>
      </header>
      <div className={bodyClassName}>{children}</div>
    </div>,
    document.body,
  );
}
