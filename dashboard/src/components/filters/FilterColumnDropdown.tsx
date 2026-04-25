'use client';

import { useTranslations } from 'next-intl';
import { ChevronDownIcon, TagsIcon } from 'lucide-react';
import {
  BADropdownMenu,
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
  BADropdownMenuActiveIndicator,
} from '@/components/ba-dropdown-menu';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/filterColumnOptions';
import { type FilterColumn, type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy, isNestedFilter } from '@/entities/analytics/filterColumnStrategy';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { cn } from '@/lib/utils';

const DEMO_ALLOWED_COLUMNS = new Set<FilterColumn>(['url', 'device_type']);

type FilterColumnDropdownProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: (filter: QueryFilter & TEntity) => void;
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
  const isNested = isNestedFilter(filter);

  return (
    <div className={cn('flex flex-col', className)}>
      {isNested && (
        <span className='text-muted-foreground/60 h-filter-subtitle px-1 text-xs leading-none'>
          {t('globalProperties', { count: 1 })}
        </span>
      )}
      <BADropdownMenu modal>
        <BADropdownMenuTrigger asChild>
          <button
            className={cn(
              'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring',
            )}
          >
            <span className='flex items-center gap-2 truncate'>{columnLabel}</span>
            <ChevronDownIcon className='size-4 opacity-50' />
          </button>
        </BADropdownMenuTrigger>
        <BADropdownMenuContent
          collisionPadding={16}
          align='start'
          className='min-w-56'
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
                  className='cursor-pointer'
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
          <BADropdownMenuSub>
            <BADropdownMenuSubTrigger
              active={isNested}
              disabled={isDemo}
              className='[&_svg:not([class*="text-"])]:text-muted-foreground gap-2'
            >
              <TagsIcon className='size-4' />
              {t('globalProperties', { count: 2 })}
              {isDemo && (
                <span className='text-muted-foreground ml-auto text-xs'>{tDemo('notAvailable')}</span>
              )}
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
                      const next = `gp.${key}` as typeof filter.column;
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
        </BADropdownMenuContent>
      </BADropdownMenu>
    </div>
  );
}
