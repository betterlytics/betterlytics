'use client';

import { type ReactNode, useCallback, useRef } from 'react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type BAMultiSelectProps<T> = {
  items: T[];
  getItemId: (item: T) => string;
  renderBadge: (item: T) => ReactNode;
  onBadgeClick?: (item: T, element: HTMLElement) => void;
  onBadgeRemove?: (item: T) => void;
  onEmptyAreaClick?: () => void;
  onBackspace?: () => void;
  placeholder?: string;
  className?: string;
  badgeClassName?: string;
  iconSlot?: ReactNode;
  disabled?: boolean;
};

export function BAMultiSelect<T>({
  items,
  getItemId,
  renderBadge,
  onBadgeClick,
  onBadgeRemove,
  onEmptyAreaClick,
  onBackspace,
  placeholder,
  className,
  badgeClassName,
  iconSlot,
  disabled,
}: BAMultiSelectProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const target = e.target as HTMLElement;
      if (!target.closest('[data-badge]')) {
        onEmptyAreaClick?.();
      }
    },
    [disabled, onEmptyAreaClick],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Backspace' && items.length > 0) {
        onBackspace?.();
      }
    },
    [items.length, onBackspace],
  );

  return (
    <div
      ref={containerRef}
      tabIndex={disabled ? undefined : 0}
      role='group'
      aria-label={placeholder ?? 'Selected items'}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 relative flex min-h-[36px] cursor-pointer items-center rounded-md border text-sm transition-[color,box-shadow] outline-none focus-within:ring-[3px]',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        items.length > 0 ? 'p-1' : 'px-3 py-1.5',
        iconSlot && 'pr-9',
        className,
      )}
    >
      <div data-slot='badge-area' className='flex min-h-[24px] flex-1 flex-wrap gap-1'>
        {items.length === 0 && placeholder && (
          <span className='text-muted-foreground/70 select-none text-sm'>{placeholder}</span>
        )}
        {items.map((item) => (
          <div
            key={getItemId(item)}
            data-badge
            className={cn(
              'animate-fadeIn bg-background text-secondary-foreground hover:bg-muted/50 relative inline-flex h-[26px] cursor-default items-center rounded-md border pl-2 text-xs font-medium transition-all',
              onBadgeRemove ? 'pr-7' : 'pr-2',
              badgeClassName,
            )}
          >
            <span
              className={cn('truncate', onBadgeClick && 'cursor-pointer')}
              onClick={(e) => {
                e.stopPropagation();
                const badge = e.currentTarget.parentElement as HTMLElement;
                onBadgeClick?.(item, badge);
              }}
            >
              {renderBadge(item)}
            </span>
            {onBadgeRemove && (
              <button
                type='button'
                className='text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute -inset-y-px -right-px flex size-7 cursor-pointer items-center justify-center rounded-r-md border border-transparent p-0 outline-hidden transition-[color,box-shadow] outline-none focus-visible:ring-[3px]'
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onBadgeRemove(item);
                }}
                aria-label='Remove'
              >
                <XIcon size={14} aria-hidden='true' />
              </button>
            )}
          </div>
        ))}
      </div>
      {iconSlot && (
        <div className='absolute right-0 top-0 flex size-9 items-center justify-center'>
          {iconSlot}
        </div>
      )}
    </div>
  );
}
