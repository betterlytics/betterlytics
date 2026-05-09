'use client';

import {
  BADropdownMenu,
  BADropdownMenuActiveIndicator,
  BADropdownMenuContent,
  BADropdownMenuEmpty,
  BADropdownMenuGroup,
  BADropdownMenuItem,
  BADropdownMenuLabel,
  BADropdownMenuSeparator,
  BADropdownMenuSkeletonItem,
  BADropdownMenuSub,
  BADropdownMenuSubContent,
  BADropdownMenuSubTrigger,
  BADropdownMenuTrigger,
} from '@/components/ba-dropdown-menu';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/filterColumnOptions';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { type FilterColumn, type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, TagsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dispatch } from 'react';

const DEMO_ALLOWED_COLUMNS = new Set<FilterColumn>(['url', 'device_type']);

type FilterColumnDropdownProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  globalPropertyKeys?: string[];
  className?: string;
};

export function FilterColumnDropdown<TEntity>({
  filter,
  onFilterUpdate,
  globalPropertyKeys,
  className,
}: FilterColumnDropdownProps<TEntity>) {
  const t = useTranslations('components.filters');
  const tDemo = useTranslations('components.demoMode');
  const { isDemo } = useDashboardAuth();

  const strategy = getFilterStrategy(filter.column);
  const columnLabel = strategy.type === 'standard' ? t(`columns.${strategy.key}`) : strategy.key;
  const triggerIcon =
    strategy.type === 'json_property'
      ? <TagsIcon />
      : FILTER_COLUMN_SELECT_OPTIONS.find((opt) => opt.value === strategy.key)?.icon;

  return (
    <div className={cn('flex flex-col', className)}>
      <BADropdownMenu modal>
        <BADropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 shadow-xs',
              'cursor-pointer text-sm whitespace-nowrap outline-none',
              'dark:bg-input/30 dark:hover:bg-input/50',
              'data-[placeholder]:text-muted-foreground',
              '[&_svg]:text-muted-foreground [&_svg:not([class*="size-"])]:size-4',
              'focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50',
            )}
          >
            <span className='flex items-center gap-2 [&_svg]:shrink-0'>
              {triggerIcon}
              <span className='truncate'>
                {columnLabel}
              </span>
            </span>
            <ChevronDownIcon className='opacity-50' />
          </button>
        </BADropdownMenuTrigger>
        <BADropdownMenuContent
          align='start'
          scrollClassName='max-h-72 sm:max-h-[min(36rem,calc(var(--radix-dropdown-menu-content-available-height)-0.5rem))]'
        >
          <BADropdownMenuLabel className='text-muted-foreground text-xs font-normal'>
            {t('type')}
          </BADropdownMenuLabel>
          <BADropdownMenuGroup>
            {FILTER_COLUMN_SELECT_OPTIONS.map((column) => {
              const disabled = isDemo && !DEMO_ALLOWED_COLUMNS.has(column.value);
              const active = filter.column === column.value;
              return (
                <BADropdownMenuItem
                  key={column.value}
                  disabled={disabled}
                  active={active}
                  onSelect={() => {
                    if (filter.column === column.value) return;
                    onFilterUpdate({ ...filter, column: column.value, values: [] });
                  }}
                >
                  {column.icon}
                  {t(`columns.${column.value}`)}
                  {disabled && (
                    <span className='text-muted-foreground ml-auto text-xs'>{tDemo('notAvailable')}</span>
                  )}
                  <BADropdownMenuActiveIndicator />
                </BADropdownMenuItem>
              );
            })}
          </BADropdownMenuGroup>
          <BADropdownMenuSeparator />
          {isDemo ? (
            <BADropdownMenuItem disabled>
              <TagsIcon />
              {t('globalProperties', { count: 2 })}
              <span className='text-muted-foreground ml-auto text-xs'>{tDemo('notAvailable')}</span>
            </BADropdownMenuItem>
          ) : (
            <BADropdownMenuSub>
              <BADropdownMenuSubTrigger active={strategy.type === 'json_property'}>
                <TagsIcon />
                {t('globalProperties', { count: 2 })}
              </BADropdownMenuSubTrigger>
              <BADropdownMenuSubContent scrollClassName='max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))]'>
                {globalPropertyKeys === undefined ? (
                  Array.from({ length: 3 }).map((_, i) => <BADropdownMenuSkeletonItem key={i} />)
                ) : globalPropertyKeys.length > 0 ? (
                  globalPropertyKeys.map((key) => (
                    <BADropdownMenuItem
                      key={key}
                      active={key === strategy.key}
                      onSelect={() => {
                        const next = `gp.${key}`;
                        if (filter.column === next) return;
                        onFilterUpdate({ ...filter, column: next, values: [] });
                      }}
                    >
                      <span className='truncate'>{key}</span>
                      <BADropdownMenuActiveIndicator />
                    </BADropdownMenuItem>
                  ))
                ) : (
                  <BADropdownMenuEmpty>{t('noProperties')}</BADropdownMenuEmpty>
                )}
              </BADropdownMenuSubContent>
            </BADropdownMenuSub>
          )}
        </BADropdownMenuContent>
      </BADropdownMenu>
    </div>
  );
}
