'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { useEffect } from 'react';

import { PlusIcon, XIcon } from 'lucide-react';

import { ScrollArea } from '@/components/ui-extended/scroll-area';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
  disable?: boolean;

  /** fixed option that can't be removed. */
  fixed?: boolean;

  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined;
}
interface GroupOption {
  [key: string]: Option[];
}

interface MultiSelectProps {
  value?: Option[];
  defaultOptions?: Option[];

  /** manually controlled options */
  options?: Option[];
  placeholder?: string;

  /** Loading component. */
  loadingIndicator?: React.ReactNode;

  /** Empty component. */
  emptyIndicator?: React.ReactNode;

  /** Debounce time for async search. Only work with `onSearch`. */
  delay?: number;

  /**
   * Only work with `onSearch` prop. Trigger search when `onFocus`.
   * For example, when user click on the input, it will trigger the search to get initial options.
   **/
  triggerSearchOnFocus?: boolean;

  /** async search */
  onSearch?: (value: string) => Promise<Option[]>;

  /**
   * sync search. This search will not showing loadingIndicator.
   * The rest props are the same as async search.
   * i.e.: creatable, groupBy, delay.
   **/
  onSearchSync?: (value: string) => Option[];
  onChange?: (options: Option[]) => void;

  /** Limit the maximum number of selected options. */
  maxSelected?: number;

  /** When the number of selected options exceeds the limit, the onMaxSelected will be called. */
  onMaxSelected?: (maxLimit: number) => void;

  /** Hide the placeholder when there are options selected. */
  hidePlaceholderWhenSelected?: boolean;
  disabled?: boolean;

  /** Group the options base on provided key. */
  groupBy?: string;
  className?: string;
  badgeClassName?: string;

  /** Highlight the first option when the list opens or changes. */
  selectFirstItem?: boolean;

  /** Allow user to create option when there is no option matched. */
  creatable?: boolean;

  /** Class name of the root element that holds the input and the dropdown. */
  rootClassName?: string;

  /** Props of the search input */
  inputProps?: Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'placeholder' | 'disabled'>;

  /** hide the clear all button. */
  hideClearAllButton?: boolean;

  /** Controlled input value. When provided, input becomes controlled. */
  inputValue?: string;

  /** Callback when input value changes. Required when inputValue is controlled. */
  onInputValueChange?: (value: string) => void;

  /** Custom renderer for option content in the dropdown list and selected badges. Defaults to option.label. */
  renderOption?: (option: Option) => React.ReactNode;

  /** Rendered below the option list, e.g. a note that the list is truncated. */
  footer?: React.ReactNode;
}

export interface MultiSelectRef {
  selectedValue: Option[];
  input: HTMLInputElement;
  focus: () => void;
  reset: () => void;
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

function transToGroupOption(options: Option[], groupBy?: string) {
  if (options.length === 0) {
    return {};
  }

  if (!groupBy) {
    return {
      '': options,
    };
  }

  const groupOption: GroupOption = {};

  options.forEach((option) => {
    const key = (option[groupBy] as string) || '';

    if (!groupOption[key]) {
      groupOption[key] = [];
    }

    groupOption[key].push(option);
  });

  return groupOption;
}

function removePickedOption(groupOption: GroupOption, picked: Option[]) {
  const cloneOption = JSON.parse(JSON.stringify(groupOption)) as GroupOption;

  for (const [key, value] of Object.entries(cloneOption)) {
    cloneOption[key] = value.filter((val) => !picked.find((p) => p.value === val.value));
  }

  return cloneOption;
}

function isOptionsExist(groupOption: GroupOption, targetOption: Option[]) {
  for (const [, value] of Object.entries(groupOption)) {
    if (value.some((option) => targetOption.find((p) => p.value === option.value))) {
      return true;
    }
  }

  return false;
}

const ROW_HEIGHT = 32;
const MAX_LIST_HEIGHT = 300;
const OVERSCAN_ROWS = 5;

type ListRow =
  | { type: 'heading'; key: string; label: string }
  | { type: 'option'; key: string; option: Option }
  | { type: 'create'; key: string; value: string };

function isSelectableRow(row: ListRow) {
  return row.type === 'create' || (row.type === 'option' && !row.option.disable);
}

type OptionRowProps = {
  index: number;
  style: React.CSSProperties;
  rows: ListRow[];
  activeIndex: number;
  listId: string;
  onActivate: (index: number) => void;
  onSelectRow: (row: ListRow) => void;
  renderOption?: (option: Option) => React.ReactNode;
};

function OptionRow({
  index,
  style,
  rows,
  activeIndex,
  listId,
  onActivate,
  onSelectRow,
  renderOption,
}: OptionRowProps) {
  const row = rows[index];

  if (row.type === 'heading') {
    return (
      <div
        style={style}
        role='presentation'
        className='text-muted-foreground flex items-center px-2 text-xs font-medium'
      >
        {row.label}
      </div>
    );
  }

  const disabled = row.type === 'option' && row.option.disable;

  return (
    <div
      style={style}
      id={`${listId}-${index}`}
      role='option'
      aria-selected={index === activeIndex}
      aria-disabled={disabled || undefined}
      data-selected={index === activeIndex}
      onMouseMove={() => {
        if (!disabled && index !== activeIndex) onActivate(index);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={() => {
        if (!disabled) onSelectRow(row);
      }}
      className={cn(
        'flex cursor-pointer items-center gap-2 overflow-hidden rounded-sm px-2 text-sm outline-none select-none',
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
      )}
    >
      {row.type === 'create' ? (
        <>
          <PlusIcon /> <span className='truncate'>{`"${row.value}"`}</span>
        </>
      ) : renderOption ? (
        renderOption(row.option)
      ) : (
        <span className='truncate'>{row.option.label}</span>
      )}
    </div>
  );
}

export const MultiSelect = ({
  value,
  onChange,
  placeholder,
  defaultOptions: arrayDefaultOptions = [],
  options: arrayOptions,
  delay,
  onSearch,
  onSearchSync,
  loadingIndicator,
  emptyIndicator,
  maxSelected = Number.MAX_SAFE_INTEGER,
  onMaxSelected,
  hidePlaceholderWhenSelected,
  disabled,
  groupBy,
  className,
  badgeClassName,
  selectFirstItem = true,
  creatable = false,
  triggerSearchOnFocus = false,
  rootClassName,
  inputProps,
  hideClearAllButton = false,
  inputValue: inputValueProp,
  onInputValueChange,
  renderOption,
  footer,
}: MultiSelectProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const listId = React.useId();
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [onScrollbar, setOnScrollbar] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const popoverContentRef = React.useRef<HTMLDivElement>(null);

  const [selected, setSelected] = React.useState<Option[]>(value || []);

  const [options, setOptions] = React.useState<GroupOption>(transToGroupOption(arrayDefaultOptions, groupBy));

  const [internalInputValue, setInternalInputValue] = React.useState('');

  // Use controlled value if provided, otherwise use internal state
  const isInputControlled = inputValueProp !== undefined;
  const effectiveInputValue = isInputControlled ? inputValueProp : internalInputValue;

  // Helper to update input value (handles both controlled and uncontrolled modes)
  const handleInputChange = React.useCallback(
    (value: string) => {
      if (!isInputControlled) {
        setInternalInputValue(value);
      }
      onInputValueChange?.(value);
    },
    [isInputControlled, onInputValueChange],
  );

  const debouncedSearchTerm = useDebounce(effectiveInputValue, delay || 500);

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    const target = event.target as Node;
    const isInsideDropdown = dropdownRef.current?.contains(target);
    const isInsideInput = inputRef.current?.contains(target);
    const isInsidePopover = popoverContentRef.current?.contains(target);

    if (!isInsideDropdown && !isInsideInput && !isInsidePopover) {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleUnselect = React.useCallback(
    (option: Option) => {
      const newOptions = selected.filter((s) => s.value !== option.value);

      setSelected(newOptions);
      onChange?.(newOptions);
    },
    [onChange, selected],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;

      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '' && selected.length > 0) {
            const lastSelectOption = selected[selected.length - 1];

            // If last item is fixed, we should not remove it.
            if (!lastSelectOption.fixed) {
              handleUnselect(selected[selected.length - 1]);
            }
          }
        }

        // This is not a default behavior of the <input /> field
        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    [handleUnselect, selected],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchend', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (value) {
      setSelected(value);
    }
  }, [value]);

  useEffect(() => {
    /** If `onSearch` is provided, do not trigger options updated. */
    if (!arrayOptions || onSearch) {
      return;
    }

    const newOption = transToGroupOption(arrayOptions || [], groupBy);

    if (JSON.stringify(newOption) !== JSON.stringify(options)) {
      setOptions(newOption);
    }
  }, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options]);

  useEffect(() => {
    /** sync search */

    const doSearchSync = () => {
      const res = onSearchSync?.(debouncedSearchTerm);

      setOptions(transToGroupOption(res || [], groupBy));
    };

    const exec = async () => {
      if (!onSearchSync || !open) return;

      if (triggerSearchOnFocus) {
        doSearchSync();
      }

      if (debouncedSearchTerm) {
        doSearchSync();
      }
    };

    void exec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus]);

  useEffect(() => {
    /** async search */

    const doSearch = async () => {
      setIsLoading(true);
      const res = await onSearch?.(debouncedSearchTerm);

      setOptions(transToGroupOption(res || [], groupBy));
      setIsLoading(false);
    };

    const exec = async () => {
      if (!onSearch || !open) return;

      if (triggerSearchOnFocus) {
        await doSearch();
      }

      if (debouncedSearchTerm) {
        await doSearch();
      }
    };

    void exec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus]);

  const selectables = React.useMemo<GroupOption>(() => removePickedOption(options, selected), [options, selected]);

  const showCreatable =
    creatable &&
    !isOptionsExist(options, [{ value: effectiveInputValue, label: effectiveInputValue }]) &&
    !selected.find((s) => s.value === effectiveInputValue) &&
    // For async search, avoid showing the creatable item before the first load.
    (onSearch ? debouncedSearchTerm.length > 0 && !isLoading : effectiveInputValue.length > 0);

  const rows = React.useMemo<ListRow[]>(() => {
    const result: ListRow[] = [];
    for (const [group, groupOptions] of Object.entries(selectables)) {
      if (group && groupOptions.length > 0) {
        result.push({ type: 'heading', key: `heading:${group}`, label: group });
      }
      for (const option of groupOptions) {
        result.push({ type: 'option', key: `option:${option.value}`, option });
      }
    }
    if (showCreatable) {
      result.push({ type: 'create', key: 'create', value: effectiveInputValue });
    }
    return result;
  }, [selectables, showCreatable, effectiveInputValue]);

  const activeIndex = React.useMemo(() => {
    const index = rows.findIndex((row) => row.key === activeKey && isSelectableRow(row));
    if (index !== -1 || !selectFirstItem) return index;
    return rows.findIndex(isSelectableRow);
  }, [rows, activeKey, selectFirstItem]);

  // Typing changes what matches, so start again from the top of the list
  useEffect(() => {
    setActiveKey(null);
    setScrollTop(0);
    viewportRef.current?.scrollTo({ top: 0 });
  }, [effectiveInputValue]);

  useEffect(() => {
    if (!open) {
      setActiveKey(null);
      setScrollTop(0);
    }
  }, [open]);

  const selectRow = React.useCallback(
    (row: ListRow) => {
      if (row.type === 'heading') return;

      if (selected.length >= maxSelected) {
        onMaxSelected?.(selected.length);
        return;
      }

      handleInputChange('');
      const newOption = row.type === 'create' ? { value: row.value, label: row.value } : row.option;
      const newOptions = [...selected, newOption];

      setSelected(newOptions);
      onChange?.(newOptions);
      setOpen(false);
    },
    [selected, maxSelected, onMaxSelected, handleInputChange, onChange],
  );

  const activateRow = React.useCallback((index: number) => setActiveKey(rows[index]?.key ?? null), [rows]);

  // Moves the highlight by keyboard, scrolling rows that are not rendered yet into view
  const moveActive = (target: number, step: 1 | -1) => {
    let index = target;
    while (index >= 0 && index < rows.length && !isSelectableRow(rows[index])) {
      index += step;
    }
    if (index < 0 || index >= rows.length) return;

    setActiveKey(rows[index].key);

    const viewport = viewportRef.current;
    if (!viewport) return;
    const rowTop = index * ROW_HEIGHT;
    if (rowTop < viewport.scrollTop) {
      viewport.scrollTop = rowTop;
    } else if (rowTop + ROW_HEIGHT > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = rowTop + ROW_HEIGHT - viewport.clientHeight;
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;

    // Enter never submits a surrounding form, even with the list closed
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && activeIndex !== -1) selectRow(rows[activeIndex]);
      return;
    }

    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(activeIndex + 1, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(activeIndex - 1, -1);
        break;
      case 'Home':
        e.preventDefault();
        moveActive(0, 1);
        break;
      case 'End':
        e.preventDefault();
        moveActive(rows.length - 1, -1);
        break;
    }
  };

  // Rows have a fixed height, so only the ones in and near the viewport are rendered
  const listHeight = Math.min(rows.length * ROW_HEIGHT, MAX_LIST_HEIGHT);
  const clampedScrollTop = Math.min(scrollTop, Math.max(0, rows.length * ROW_HEIGHT - listHeight));
  const firstRendered = Math.max(0, Math.floor(clampedScrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
  const lastRendered = Math.min(
    rows.length,
    Math.ceil((clampedScrollTop + listHeight) / ROW_HEIGHT) + OVERSCAN_ROWS,
  );

  return (
    <PopoverPrimitive.Root open={open} modal={false}>
      <div
        ref={dropdownRef}
        onKeyDown={(e) => {
          handleKeyDown(e);
          handleListKeyDown(e);
        }}
        className={cn('text-popover-foreground flex w-full flex-col rounded-md bg-transparent', rootClassName)}
      >
        <PopoverPrimitive.Anchor asChild>
          <div
            className={cn(
              'border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive relative min-h-[36px] rounded-md border text-sm transition-[color,box-shadow] outline-none focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50',
              {
                'p-1': selected.length !== 0,
                'cursor-text': !disabled && selected.length !== 0,
              },
              !hideClearAllButton && 'pr-9',
              className,
            )}
            onClick={() => {
              if (disabled) return;
              setOpen((prev) => !prev);
              inputRef?.current?.focus();
            }}
          >
            <div className='flex flex-wrap gap-1'>
              {selected.map((option) => {
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex h-[26px] cursor-default items-center rounded-md border pr-7 pl-2 text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2',
                      badgeClassName,
                    )}
                    data-fixed={option.fixed}
                    data-disabled={disabled || undefined}
                  >
                    {renderOption ? renderOption(option) : option.label}
                    <button
                      disabled={disabled}
                      className='text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute -inset-y-px -right-px flex size-7 cursor-pointer items-center justify-center rounded-r-md border border-transparent p-0 outline-hidden transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUnselect(option);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleUnselect(option)}
                      aria-label='Remove'
                    >
                      <XIcon size={14} aria-hidden='true' />
                    </button>
                  </div>
                );
              })}
              {/* Avoid having the "Search" Icon */}
              <input
                {...inputProps}
                ref={inputRef}
                type='text'
                role='combobox'
                aria-autocomplete='list'
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={open && activeIndex !== -1 ? `${listId}-${activeIndex}` : undefined}
                autoComplete='off'
                autoCorrect='off'
                spellCheck={false}
                value={effectiveInputValue}
                disabled={disabled}
                onChange={(event) => {
                  const value = event.target.value;
                  handleInputChange(value);
                  // Open dropdown when typing
                  if (value && !open) {
                    setOpen(true);
                  }
                  inputProps?.onChange?.(event);
                }}
                onBlur={(event) => {
                  // When creatable and input has value, add it as a selection on blur
                  if (creatable && effectiveInputValue.trim().length > 0) {
                    const trimmedValue = effectiveInputValue.trim();
                    // Only add if not already selected and under max limit
                    if (!selected.find((s) => s.value === trimmedValue) && selected.length < maxSelected) {
                      const newOptions = [...selected, { value: trimmedValue, label: trimmedValue }];
                      setSelected(newOptions);
                      onChange?.(newOptions);
                    }
                    handleInputChange('');
                  }

                  if (!onScrollbar) {
                    setOpen(false);
                  }

                  inputProps?.onBlur?.(event);
                }}
                onFocus={(event) => {
                  // Don't auto-open on focus, let click handler control toggle
                  if (triggerSearchOnFocus) {
                    onSearch?.(debouncedSearchTerm);
                  }

                  inputProps?.onFocus?.(event);
                }}
                placeholder={hidePlaceholderWhenSelected && selected.length !== 0 ? '' : placeholder}
                className={cn(
                  'placeholder:text-muted-foreground/70 flex-1 bg-transparent outline-hidden disabled:cursor-not-allowed',
                  {
                    'w-full': hidePlaceholderWhenSelected,
                    'px-3 py-1.5': selected.length === 0,
                    'ml-1 min-w-0': selected.length !== 0,
                  },
                  inputProps?.className,
                )}
              />
              <button
                type='button'
                onClick={() => {
                  setSelected(selected.filter((s) => s.fixed));
                  onChange?.(selected.filter((s) => s.fixed));
                }}
                className={cn(
                  'text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute top-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]',
                  (hideClearAllButton ||
                    disabled ||
                    selected.length < 1 ||
                    selected.filter((s) => s.fixed).length === selected.length) &&
                    'hidden',
                )}
                aria-label='Clear all'
              >
                <XIcon size={16} aria-hidden='true' />
              </button>
            </div>
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={popoverContentRef}
            align='start'
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={cn(
              'border-input z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            )}
            onMouseDown={(e) => {
              // Prevent blur when clicking inside dropdown
              e.preventDefault();
            }}
          >
            <div
              className='bg-popover text-popover-foreground shadow-lg outline-hidden'
              onMouseLeave={() => {
                setOnScrollbar(false);
              }}
              onMouseEnter={() => {
                setOnScrollbar(true);
              }}
              onMouseUp={() => {
                inputRef?.current?.focus();
              }}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                loadingIndicator
              ) : rows.length === 0 ? (
                <div id={listId} role='listbox' className='px-2 py-4 text-center text-sm'>
                  {emptyIndicator}
                </div>
              ) : (
                <>
                  <div className='p-1'>
                    <ScrollArea
                      viewportRef={viewportRef}
                      onViewportScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                      viewportClassName='[&>div]:!block'
                      className='[&_[data-slot=scroll-area-scrollbar]]:!w-2'
                      style={{ height: listHeight }}
                    >
                      <div
                        id={listId}
                        role='listbox'
                        className='relative'
                        style={{ height: rows.length * ROW_HEIGHT }}
                      >
                        {rows.slice(firstRendered, lastRendered).map((row, offset) => {
                          const index = firstRendered + offset;
                          return (
                            <OptionRow
                              key={row.key}
                              index={index}
                              style={{
                                position: 'absolute',
                                top: index * ROW_HEIGHT,
                                left: 0,
                                right: 0,
                                height: ROW_HEIGHT,
                              }}
                              rows={rows}
                              activeIndex={activeIndex}
                              listId={listId}
                              onActivate={activateRow}
                              onSelectRow={selectRow}
                              renderOption={renderOption}
                            />
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                  {footer}
                </>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </div>
    </PopoverPrimitive.Root>
  );
};
