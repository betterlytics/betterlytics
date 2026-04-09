'use client';

import { Dispatch, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon, CheckIcon, TagsIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DropdownContentController } from '@/components/DropdownContentController';
import { QueryFilterInputSubMenu } from '@/components/filters/QueryFilterInputSubMenu';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/QueryFilterInputRow';
import { type FilterColumn, type QueryFilter, GP_PREFIX } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { getGlobalPropertyKeysAction } from '@/app/actions/analytics/filters.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const DEMO_ALLOWED_COLUMNS = new Set<FilterColumn>(['url', 'device_type']);

type FilterColumnDropdownProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  className?: string;
};

export function FilterColumnDropdown<TEntity>({
  filter,
  onFilterUpdate,
  className,
}: FilterColumnDropdownProps<TEntity>) {
  const isMobile = useIsMobile();
  const t = useTranslations('components.filters');
  const tDemo = useTranslations('components.demoMode');
  const { isDemo } = useDashboardAuth();
  const dashboardId = useDashboardId();
  const analyticsQuery = useAnalyticsQuery();

  const { data: globalPropertyKeys = [], isLoading: isLoadingPropertyKeys } = useQuery({
    queryKey: ['global-property-keys', dashboardId, analyticsQuery.startDate?.toString(), analyticsQuery.endDate?.toString()],
    queryFn: () => getGlobalPropertyKeysAction(dashboardId, analyticsQuery, { limit: 50 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const filterKeyRef = useRef<string>(filter.column);
  useEffect(() => {
    if (filter.column !== filterKeyRef.current) {
      onFilterUpdate({ ...filter, values: [] });
      filterKeyRef.current = filter.column;
    }
  }, [filter.column]);

  const strategy = getFilterStrategy(filter.column);
  const columnLabel = strategy.type === 'standard' ? t(`columns.${strategy.key}`) : strategy.key;

  return (
    <div className={cn('flex flex-col', className)}>
      {strategy.type === 'json_property' && (
        <span className='text-muted-foreground/60 mb-0.5 px-1 text-xs leading-none'>
          {t('globalProperties', { count: 1 })}
        </span>
      )}
      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px]',
            )}
          >
            <span className='flex items-center gap-2 truncate'>{columnLabel}</span>
            <ChevronDownIcon className='size-4 opacity-50' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent collisionPadding={16} align='start' className='min-w-56 overflow-clip!'>
          <DropdownContentController
            className={
              isMobile
                ? 'max-h-72'
                : 'max-h-[min(36rem,calc(var(--radix-dropdown-menu-content-available-height)-0.5rem))]'
            }
            scrollToKey={strategy.type === 'json_property' ? GP_PREFIX : filter.column}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs font-normal'>
              {t('type')}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {FILTER_COLUMN_SELECT_OPTIONS.map((column) => {
                const disabled = isDemo && !DEMO_ALLOWED_COLUMNS.has(column.value);
                const active = filter.column === column.value;
                return (
                  <DropdownMenuItem
                    key={column.value}
                    className='cursor-pointer'
                    disabled={disabled}
                    data-scroll-key={column.value}
                    onSelect={() => onFilterUpdate({ ...filter, column: column.value })}
                  >
                    {column.icon}
                    {t(`columns.${column.value}`)}
                    {disabled && (
                      <span className='text-muted-foreground ml-auto text-xs'>{tDemo('notAvailable')}</span>
                    )}
                    {active && <CheckIcon className='ml-auto size-4' />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <QueryFilterInputSubMenu
              label={t('globalProperties', { count: 2 })}
              icon={<TagsIcon className='size-4' />}
              items={globalPropertyKeys.map((key) => ({ key, label: key }))}
              activeKey={strategy.key}
              scrollKey={GP_PREFIX}
              isLoading={isLoadingPropertyKeys}
              disabled={isDemo}
              onSelect={(key) => onFilterUpdate({ ...filter, column: `gp.${key}` })}
            />
          </DropdownContentController>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
