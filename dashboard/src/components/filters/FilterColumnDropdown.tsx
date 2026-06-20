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
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { type FilterColumn, type QueryFilter } from '@/entities/analytics/filter.entities';
import { PROPERTY_SOURCE_LIST, type PropertyKeysBySource } from '@/entities/analytics/propertySources';
import { cn } from '@/lib/utils';
import { Braces as BracesIcon, ChevronDownIcon, TagsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dispatch } from 'react';

const DEMO_ALLOWED_COLUMNS = new Set<FilterColumn>(['url', 'device_type']);

type FilterColumnDropdownProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  propertyKeys?: PropertyKeysBySource;
  className?: string;
};

export function FilterColumnDropdown<TEntity>({
  filter,
  onFilterUpdate,
  propertyKeys,
  className,
}: FilterColumnDropdownProps<TEntity>) {
  const t = useTranslations('components.filters');
  const tDemo = useTranslations('components.demoMode');
  const { isDemo } = useDashboardAuth();

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
              {t('properties')}
              <span className='text-muted-foreground ml-auto text-xs'>{tDemo('notAvailable')}</span>
            </BADropdownMenuItem>
          ) : (
            PROPERTY_SOURCE_LIST.map(({ source, labelKey }) => (
              <PropertyKeysSubmenu
                key={source}
                source={source}
                label={t(labelKey, { count: 2 })}
                icon={source === 'cep' ? <BracesIcon /> : <TagsIcon />}
                emptyLabel={t('noProperties')}
                keys={propertyKeys?.[source]}
                filter={filter}
                onFilterUpdate={onFilterUpdate}
              />
            ))
          )}
        </BADropdownMenuContent>
      </BADropdownMenu>
    </div>
  );
}
