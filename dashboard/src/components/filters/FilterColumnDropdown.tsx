'use client';

import {
  BADropdownMenu,
  BADropdownMenuActiveIndicator,
  BADropdownMenuContent,
  BADropdownMenuGroup,
  BADropdownMenuItem,
  BADropdownMenuLabel,
  BADropdownMenuSeparator,
  BADropdownMenuTrigger,
} from '@/components/ba-dropdown-menu';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/filterColumnOptions';
import { FilterColumnLabel } from '@/components/filters/FilterColumnLabel';
import { PropertyKeysSubmenu } from '@/components/filters/PropertyKeysSubmenu';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { PROPERTY_SOURCE_LIST, type PropertyKeysBySource } from '@/entities/analytics/propertySources';
import { useQueryFilterColumnsVisibility } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import {
  useFilterColumnStatus,
  useFilterColumnDisabledMessage,
  usePropertySourceStatus,
} from '@/hooks/use-is-filter-column-allowed';
import { PROPERTY_SOURCE_ICONS } from '@/components/filters/propertySourceIcons';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dispatch, useMemo } from 'react';

type FilterColumnDropdownProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  propertyKeys?: PropertyKeysBySource;
  className?: string;
  disabled?: boolean;
};

export function FilterColumnDropdown<TEntity>({
  filter,
  onFilterUpdate,
  propertyKeys,
  className,
  disabled = false,
}: FilterColumnDropdownProps<TEntity>) {
  const t = useTranslations('components.filters');
  const getColumnStatus = useFilterColumnStatus();
  const getSourceStatus = usePropertySourceStatus();
  const getDisabledMessage = useFilterColumnDisabledMessage();
  const { mode } = useQueryFilterColumnsVisibility();

  const columnOptions = useMemo(
    () =>
      FILTER_COLUMN_SELECT_OPTIONS.map((column) => {
        const status = getColumnStatus(column.value);
        return { column, status, disabledMessage: getDisabledMessage(status) };
      }).filter(({ status }) => mode === 'disable' || status.reason !== 'page'),
    [getColumnStatus, getDisabledMessage, mode],
  );

  const propertySources = useMemo(
    () =>
      PROPERTY_SOURCE_LIST.map((entry) => {
        const status = getSourceStatus(entry.source);
        return { ...entry, status, disabledMessage: getDisabledMessage(status) };
      }).filter(({ status }) => mode === 'disable' || status.reason !== 'page'),
    [getSourceStatus, getDisabledMessage, mode],
  );

  return (
    <div className={cn('flex flex-col', className)}>
      <BADropdownMenu modal>
        <BADropdownMenuTrigger asChild disabled={disabled}>
          <button
            disabled={disabled}
            className={cn(
              'border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 shadow-xs',
              'cursor-pointer text-sm whitespace-nowrap outline-none',
              'dark:bg-input/30 dark:hover:bg-input/50',
              'data-[placeholder]:text-muted-foreground',
              '[&_svg]:text-muted-foreground [&_svg:not([class*="size-"])]:size-4',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring',
              'disabled:cursor-default disabled:opacity-50',
            )}
          >
            <FilterColumnLabel column={filter.column} className='min-w-0 gap-2' />
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
            {columnOptions.map(({ column, status, disabledMessage }) => {
              const active = filter.column === column.value;
              return (
                <BADropdownMenuItem
                  key={column.value}
                  disabled={status.disabled}
                  active={active}
                  onSelect={() => {
                    if (filter.column === column.value) return;
                    onFilterUpdate({ ...filter, column: column.value, values: [] });
                  }}
                >
                  {column.icon}
                  {t(`columns.${column.value}`)}
                  {disabledMessage && (
                    <span className='text-muted-foreground ml-auto text-xs'>{disabledMessage}</span>
                  )}
                  <BADropdownMenuActiveIndicator />
                </BADropdownMenuItem>
              );
            })}
          </BADropdownMenuGroup>
          {propertySources.length > 0 && <BADropdownMenuSeparator />}
          {propertySources.map(({ source, labelKey, status, disabledMessage }) =>
            status.disabled ? (
              <BADropdownMenuItem key={source} disabled>
                {PROPERTY_SOURCE_ICONS[source]}
                {t(labelKey, { count: 2 })}
                <span className='text-muted-foreground ml-auto text-xs'>{disabledMessage}</span>
              </BADropdownMenuItem>
            ) : (
              <PropertyKeysSubmenu
                key={source}
                source={source}
                label={t(labelKey, { count: 2 })}
                icon={PROPERTY_SOURCE_ICONS[source]}
                emptyLabel={t('noProperties')}
                keys={propertyKeys?.[source]}
                filter={filter}
                onFilterUpdate={onFilterUpdate}
              />
            ),
          )}
        </BADropdownMenuContent>
      </BADropdownMenu>
    </div>
  );
}
