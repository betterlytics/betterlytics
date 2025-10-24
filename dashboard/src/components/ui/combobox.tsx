'use client';

import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Plus } from 'lucide-react';

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
  searchPlaceholder = 'Search…',
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
          setOpen(nextOpen);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              'h-9',
              'text-left font-normal',
              !hasSelection && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <span className='truncate'>{hasSelection ? selectedLabel : placeholder}</span>
            <ChevronDown className='h-4 w-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
          <div className='flex flex-col gap-2 p-2'>
            {enableSearch ? (
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = (searchQuery || '').trim();
                    if (trimmed.length === 0) {
                      if (options.length > 0) {
                        onValueChange(options[0]);
                        setOpen(false);
                      }
                    } else {
                      onValueChange(trimmed);
                      setOpen(false);
                    }
                  }
                }}
                className='h-8'
              />
            ) : null}

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
