'use client';

import { Fragment, type Dispatch, type ReactNode, type Ref, useCallback } from 'react';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type BAMultiSelectProps<T> = {
  items: T[];
  getItemId: (item: T) => string;
  renderBadge: (item: T) => ReactNode;
  onBadgeClick?: (item: T, element: HTMLElement) => void;
  onBadgeRemove?: Dispatch<T>;
  onEmptyAreaClick?: () => void;
  onBackspace?: () => void;
  placeholder?: string;
  separator?: ReactNode;
  className?: string;
  badgeClassName?: string;
  iconSlot?: ReactNode;
  disabled?: boolean;
  expanded?: boolean;
  ref?: Ref<HTMLDivElement>;
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
  separator,
  className,
  badgeClassName,
  iconSlot,
  disabled,
  expanded,
  ref,
}: BAMultiSelectProps<T>) {
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
      if (disabled) return;
      if (e.key === 'Backspace' && items.length > 0) {
        onBackspace?.();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onEmptyAreaClick?.();
      }
    },
    [disabled, items.length, onBackspace, onEmptyAreaClick],
  );

  return (
    <div
      ref={ref}
      tabIndex={disabled ? undefined : 0}
      role='combobox'
      aria-haspopup='dialog'
      aria-expanded={expanded ?? false}
      aria-label={placeholder ?? 'Selected items'}
      onMouseDown={(e) => {
        if (disabled) return;
        e.preventDefault();
      }}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'border-input dark:bg-input/30 dark:hover:bg-input/50 focus-within:border-ring focus-within:ring-ring/50 relative flex min-h-[36px] cursor-pointer items-center rounded-md border bg-transparent text-sm shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]',
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
        {items.map((item, index) => (
          <Fragment key={getItemId(item)}>
            {index > 0 && separator}
          <div
            data-badge
            className={cn(
              'animate-fadeIn bg-popover text-secondary-foreground hover:bg-background relative inline-flex h-[26px] cursor-default items-center rounded-md border pl-2 text-xs font-medium transition-all has-[[data-badge-text]:focus-visible]:ring-[2px] has-[[data-badge-text]:focus-visible]:ring-ring/50',
              onBadgeRemove ? 'pr-7' : 'pr-2',
              badgeClassName,
            )}
          >
            <span
              data-badge-text
              className={cn(
                'truncate outline-none',
                onBadgeClick && 'cursor-pointer',
              )}
              role={onBadgeClick ? 'button' : undefined}
              tabIndex={onBadgeClick ? 0 : undefined}
              onClick={(e) => {
                e.stopPropagation();
                const badge = e.currentTarget.parentElement as HTMLElement;
                onBadgeClick?.(item, badge);
              }}
              onKeyDown={(e) => {
                if (!onBadgeClick) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  const badge = e.currentTarget.parentElement as HTMLElement;
                  onBadgeClick(item, badge);
                }
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
          </Fragment>
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
