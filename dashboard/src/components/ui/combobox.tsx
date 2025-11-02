'use client';

import { useMemo, useState, useId, useRef, useEffect, type ReactNode } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from './popover';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Plus, ChevronDownIcon } from 'lucide-react';
import { formatString } from '@/utils/formatters';

type NavigationDirection = 'up' | 'down' | 'tab';

const updateHighlightedIndex = (
  currentIndex: number | null,
  direction: NavigationDirection,
  totalItemCount: number,
): number => {
  if (totalItemCount === 0) return 0;

  switch (direction) {
    case 'down':
    case 'tab':
      if (currentIndex === null) return 0;
      return Math.min(currentIndex + 1, totalItemCount - 1);
    case 'up':
      if (currentIndex === null) return totalItemCount - 1;
      return Math.max(currentIndex - 1, 0);
    default:
      return currentIndex ?? 0;
  }
};

type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  emptyState: ReactNode;
  onSearchChange?: (q: string) => void;
  searchQuery?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  enableSearch?: boolean;
};

export function Combobox({
  value,
  onValueChange,
  options,
  onSearchChange,
  searchQuery,
  placeholder,
  loading = false,
  disabled = false,
  className,
  triggerClassName,
  emptyState,
  enableSearch = true,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const hasSelection = Boolean(value);
  const selectedLabel = useMemo(() => value || '', [value]);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skipBlurCommitRef = useRef(false);

  const commitValue = (val: string) => {
    onSearchChange?.(val);
    onValueChange(val);
    setHighlightedIndex(null);
    setOpen(false);
  };
  const trimmedSearch = useMemo(() => (searchQuery ?? '').trim(), [searchQuery]);
  const canCreate = useMemo(
    () => enableSearch && trimmedSearch.length > 0 && !options.includes(trimmedSearch),
    [enableSearch, trimmedSearch, options],
  );
  const totalItemCount = options.length + (canCreate ? 1 : 0);
  const activeInput = enableSearch ? trimmedSearch : selectedLabel.trim();

  useEffect(() => {
    if (highlightedIndex === null) return;
    const maxIndex = totalItemCount - 1;
    if (maxIndex < 0) {
      setHighlightedIndex(null);
      return;
    }
    if (highlightedIndex > maxIndex) setHighlightedIndex(maxIndex);
  }, [totalItemCount, highlightedIndex]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            role='combobox'
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete={enableSearch ? 'list' : undefined}
            placeholder={placeholder ?? ''}
            disabled={disabled}
            value={enableSearch ? searchQuery : selectedLabel}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(e) => {
              if (!enableSearch) return;
              onSearchChange?.(e.target.value);
              if (!open) setOpen(true);
              setHighlightedIndex(null);
            }}
            onBlur={(e) => {
              if (!enableSearch || (e.relatedTarget && rootRef.current?.contains(e.relatedTarget))) return;
              if (skipBlurCommitRef.current) {
                skipBlurCommitRef.current = false;
                return;
              }
              commitValue(trimmedSearch);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                if (open) {
                  e.preventDefault();
                  if (totalItemCount === 0) return;
                  setHighlightedIndex((prev) => updateHighlightedIndex(prev, 'tab', totalItemCount));
                }
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (totalItemCount === 0) return;
                setHighlightedIndex((prev) => updateHighlightedIndex(prev, 'down', totalItemCount));
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (totalItemCount === 0) return;
                setHighlightedIndex((prev) => updateHighlightedIndex(prev, 'up', totalItemCount));
                return;
              }
              if (e.key === 'Escape') {
                setOpen(false);
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex !== null) {
                  const isCreate = canCreate && highlightedIndex === options.length;
                  const selected = isCreate ? activeInput : options[highlightedIndex];
                  if (selected) commitValue(selected);
                  return;
                }
                const fallback = activeInput.length > 0 ? activeInput : options[0];
                if (fallback) commitValue(fallback);
              }
            }}
            className={cn(
              'h-9 w-full pr-8 text-base md:text-sm',
              !hasSelection && 'text-muted-foreground',
              triggerClassName,
            )}
          />
        </PopoverAnchor>
        <div className='pointer-events-none absolute inset-y-0 right-2 flex items-center'>
          <ChevronDownIcon className='size-4 opacity-50' />
        </div>
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          onOpenAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={(e) => {
            const target = e.target as Node | null;
            if (target && rootRef.current && rootRef.current.contains(target)) {
              e.preventDefault();
            }
          }}
        >
          <div className='flex flex-col gap-2'>
            <div
              className='max-h-[min(60vh,15rem)] touch-pan-y overflow-y-auto overscroll-contain rounded [-webkit-overflow-scrolling:touch]'
              onTouchMove={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className='text-muted-foreground p-3 text-sm'>Loading…</div>
              ) : (
                (() => {
                  if (!canCreate && options.length === 0) {
                    return emptyState;
                  }

                  return (
                    <ul className='divide-y p-1' role='listbox' id={listboxId}>
                      {options.map((opt, idx) => (
                        <li key={opt} className='border-none'>
                          <button
                            type='button'
                            role='option'
                            aria-selected={highlightedIndex === idx}
                            className={cn(
                              'hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 text-sm',
                              highlightedIndex === idx && 'bg-accent',
                            )}
                            onMouseDown={() => {
                              skipBlurCommitRef.current = true;
                            }}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onMouseLeave={() => setHighlightedIndex(null)}
                            onClick={() => commitValue(opt)}
                          >
                            <span className='truncate'>{formatString(opt, 24)}</span>
                          </button>
                        </li>
                      ))}
                      {canCreate ? (
                        <li key='__use-input__' className='border-none'>
                          <button
                            type='button'
                            role='option'
                            aria-selected={highlightedIndex === options.length}
                            className={cn(
                              'hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5 text-sm',
                              highlightedIndex === options.length && 'bg-accent',
                            )}
                            onMouseDown={() => {
                              skipBlurCommitRef.current = true;
                            }}
                            onMouseEnter={() => setHighlightedIndex(options.length)}
                            onMouseLeave={() => setHighlightedIndex(null)}
                            onClick={() => commitValue(trimmedSearch)}
                          >
                            <Plus className='h-4 w-4' />
                            <span className='truncate'>"{formatString(trimmedSearch, 18)}"</span>
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  );
                })()
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
