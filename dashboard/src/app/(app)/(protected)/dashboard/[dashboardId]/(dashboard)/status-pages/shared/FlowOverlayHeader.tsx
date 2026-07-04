'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type FlowOverlayHeaderProps = {
  title: ReactNode;
  closeAriaLabel: string;
  onClose: () => void;
  /** Optional centered content (like a stepper for the create wizard). */
  center?: ReactNode;
  /** Right-aligned actions (Back / Continue, or Cancel / Save). */
  actions?: ReactNode;
};

/**
 * The top bar for a {@link FlowOverlay}: close button + title, an optional centered
 * slot, and right-aligned actions. Owns Escape-to-close so the binding lives with the
 * close handler. Each flow state (loading shell, loaded form) renders its own header
 * with the close semantics it wants, and only one is mounted at a time.
 */
export function FlowOverlayHeader({ title, closeAriaLabel, onClose, center, actions }: FlowOverlayHeaderProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
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
  );
}
