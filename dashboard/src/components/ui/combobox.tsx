'use client';

import { useMemo, useState } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from './popover';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  onSearchChange?: (q: string) => void;
  searchQuery?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
  enableSearch?: boolean;
};

export function Combobox({
  value,
  onValueChange,
  options,
  onSearchChange,
  searchQuery,
  placeholder = 'Select value',
  loading = false,
  disabled = false,
  className,
  triggerClassName,
  emptyMessage = 'No results',
  enableSearch = true,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const hasSelection = Boolean(value);
  const selectedLabel = useMemo(() => value || '', [value]);

  return (
    <div className={cn('relative', className)}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onSearchChange?.('');
          }
        }}
      >
        <Input
          placeholder={placeholder}
          disabled={disabled}
          value={enableSearch ? searchQuery || selectedLabel : selectedLabel}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            if (!enableSearch) return;
            onSearchChange?.(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
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
          className={cn('h-9 w-full', !hasSelection && 'text-muted-foreground', triggerClassName)}
        />
        <PopoverAnchor className='w-full' />
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className='flex flex-col gap-2 p-2'>
            <div className='max-h-60 overflow-auto rounded border'>
              {loading ? (
                <div className='text-muted-foreground p-3 text-sm'>Loading…</div>
              ) : (
                (() => {
                  const trimmed = (searchQuery || '').trim();
                  const showCreateOption = enableSearch && trimmed.length > 0 && !options.includes(trimmed);

                  if (!showCreateOption && options.length === 0) {
                    return <div className='text-muted-foreground p-3 text-sm'>{emptyMessage}</div>;
                  }

                  return (
                    <ul className='divide-y'>
                      {showCreateOption ? (
                        <li key='__use-input__'>
                          <button
                            type='button'
                            className={cn(
                              'hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                            )}
                            onClick={() => {
                              onSearchChange?.(trimmed);
                              onValueChange(trimmed);
                              setOpen(false);
                            }}
                          >
                            <Plus className='h-4 w-4 opacity-70' />
                            <span className='truncate'>"{trimmed}"</span>
                          </button>
                        </li>
                      ) : null}

                      {options.map((opt) => (
                        <li key={opt}>
                          <button
                            type='button'
                            className='hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm'
                            onClick={() => {
                              onSearchChange?.(opt);
                              onValueChange(opt);
                              setOpen(false);
                            }}
                          >
                            <span className='truncate'>{opt}</span>
                          </button>
                        </li>
                      ))}
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
