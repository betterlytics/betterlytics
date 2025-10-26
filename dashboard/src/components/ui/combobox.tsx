'use client';

import { useMemo, useState, useId, type ReactNode } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from './popover';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Plus, ChevronDownIcon } from 'lucide-react';
import { formatString } from '@/utils/formatters';

type NavigationDirection = 'up' | 'down' | 'tab';

const updateHighlightedIndex = (
  currentIndex: number | null,
  direction: NavigationDirection,
  optionsLength: number,
): number => {
  if (optionsLength === 0) return 0;

  switch (direction) {
    case 'down':
    case 'tab':
      if (currentIndex === null) return 0;
      return Math.min(currentIndex + 1, optionsLength - 1);
    case 'up':
      if (currentIndex === null) return optionsLength - 1;
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

  return (
    <div className={cn('relative', className)}>
      <Popover open={open}>
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
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              if (open) {
                e.preventDefault();
                if (options.length === 0) return;
                setHighlightedIndex((prev) => updateHighlightedIndex(prev, 'tab', options.length));
              }
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (options.length === 0) return;
              setHighlightedIndex((prev) => updateHighlightedIndex(prev, 'down', options.length));
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (options.length === 0) return;
              setHighlightedIndex((prev) => updateHighlightedIndex(prev, 'up', options.length));
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedIndex !== null && options[highlightedIndex]) {
                const chosen = options[highlightedIndex];
                onSearchChange?.(chosen);
                onValueChange(chosen);
                setHighlightedIndex(null);
                setOpen(false);
                return;
              }
              const trimmed = ((enableSearch ? searchQuery : selectedLabel) || '').trim();
              if (trimmed.length === 0) {
                if (options.length > 0) {
                  onSearchChange?.(options[0]);
                  onValueChange(options[0]);
                  setOpen(false);
                }
              } else {
                onSearchChange?.(trimmed);
                onValueChange(trimmed);
                setOpen(false);
              }
            }
          }}
          className={cn(
            'h-9 w-full pr-8 text-base md:text-sm',
            !hasSelection && 'text-muted-foreground',
            triggerClassName,
          )}
        />
        <div className='pointer-events-none absolute inset-y-0 right-2 flex items-center'>
          <ChevronDownIcon className='size-4 opacity-50' />
        </div>
        <PopoverAnchor className='w-full' />
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          onOpenAutoFocus={(e) => e.preventDefault()}
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
                  const trimmed = (searchQuery || '').trim();
                  const showCreateOption = enableSearch && trimmed.length > 0 && !options.includes(trimmed);

                  if (!showCreateOption && options.length === 0) {
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
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onMouseLeave={() => setHighlightedIndex(null)}
                            onClick={() => {
                              onSearchChange?.(opt);
                              onValueChange(opt);
                              setHighlightedIndex(null);
                              setOpen(false);
                            }}
                          >
                            <span className='truncate'>{formatString(opt, 24)}</span>
                          </button>
                        </li>
                      ))}
                      {showCreateOption ? (
                        <li key='__use-input__'>
                          <button
                            type='button'
                            className={cn(
                              'hover:bg-accent flex w-full cursor-pointer items-center gap-2 px-2 py-2 text-sm',
                            )}
                            onClick={() => {
                              onSearchChange?.(trimmed);
                              onValueChange(trimmed);
                              setOpen(false);
                            }}
                          >
                            <Plus className='h-4 w-4 opacity-70' />
                            <span className='truncate'>"{formatString(trimmed, 18)}"</span>
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
