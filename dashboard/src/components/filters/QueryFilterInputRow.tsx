import { FilterColumn, FilterOperator, QueryFilter } from '@/entities/analytics/filter.entities';
import { getGlobalPropertyKeysAction } from '@/app/actions/analytics/filters.actions';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { QueryFilterInputSubMenu } from './QueryFilterInputSubMenu';
import { DropdownContentController } from '../DropdownContentController';
import { Dispatch, ReactNode, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightToLineIcon,
  BatteryIcon,
  Building2Icon,
  CableIcon,
  CheckIcon,
  ChevronDownIcon,
  CompassIcon,
  EarthIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  MapPinIcon,
  MonitorSmartphoneIcon,
  ShellIcon,
  SquareMousePointerIcon,
  StepBackIcon,
  SunsetIcon,
  TabletSmartphoneIcon,
  TagsIcon,
  TextCursorInputIcon,
  TextSearchIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FilterValueSearch } from './FilterValueSearch';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';

const DEMO_ALLOWED_COLUMNS = new Set<FilterColumn>(['url', 'device_type']);

type QueryFilterInputRowProps<TEntity> = {
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
  filter: QueryFilter & TEntity;
  requestRemoval: Dispatch<QueryFilter & TEntity>;
  disableDeletion?: boolean;
};

export function QueryFilterInputRow<TEntity>({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
}: QueryFilterInputRowProps<TEntity>) {
  const isMobile = useIsMobile();
  const t = useTranslations('components.filters');
  const tDemo = useTranslations('components.demoMode');
  const { isDemo } = useDashboardAuth();
  const dashboardId = useDashboardId();
  const analyticsQuery = useAnalyticsQuery();

  const { data: globalPropertyKeys = [], isLoading: isLoadingPropertyKeys } = useQuery({
    queryKey: ['global-property-keys', analyticsQuery.startDate?.toString(), analyticsQuery.endDate?.toString()],
    queryFn: () => getGlobalPropertyKeysAction(dashboardId, analyticsQuery, { limit: 50 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const filterColumnRef = useRef<string>(filter.column);
  useEffect(() => {
    if (filter.column !== filterColumnRef.current) {
      onFilterUpdate({ ...filter, values: [] });
      filterColumnRef.current = filter.column;
    }
  }, [filter.column]);

  const isGlobalProperty = filter.column === 'global_property';
  const columnLabel = isGlobalProperty
    ? filter.propertyKey || '...'
    : t(`columns.${filter.column}` as Parameters<typeof t>[0]);

  return (
    <div className='grid grid-cols-12 items-end gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <div className='col-span-8 flex flex-col md:col-span-4'>
        {isGlobalProperty && (
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
              scrollToKey={filter.column}
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
                activeKey={isGlobalProperty ? filter.propertyKey : undefined}
                scrollKey='global_property'
                isLoading={isLoadingPropertyKeys}
                disabled={isDemo}
                onSelect={(key) => onFilterUpdate({ ...filter, column: 'global_property', propertyKey: key })}
              />
            </DropdownContentController>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Select
        value={filter.operator}
        onValueChange={(operator: FilterOperator) => onFilterUpdate({ ...filter, operator })}
      >
        <SelectTrigger className='col-span-4 w-full cursor-pointer md:col-span-2'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align={'start'} position={'popper'}>
          <SelectGroup>
            <SelectLabel>{t('operator')}</SelectLabel>
            <SelectItem className='cursor-pointer' value={'='}>
              {t('is')}
            </SelectItem>
            <SelectItem className='cursor-pointer' value={'!='}>
              {t('isNot')}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className='col-span-10 md:col-span-5'
      />
      <Button
        variant='ghost'
        className='col-span-2 cursor-pointer md:col-span-1'
        onClick={() => requestRemoval(filter)}
        disabled={disableDeletion}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

type FilterColumnSelectOptions = { value: FilterColumn; icon: ReactNode; label: string }[];

export const FILTER_COLUMN_SELECT_OPTIONS: FilterColumnSelectOptions = [
  { value: 'url', icon: <TextCursorInputIcon />, label: 'URL' },
  { value: 'domain', icon: <GlobeIcon />, label: 'Hostname' },
  { value: 'device_type', icon: <TabletSmartphoneIcon />, label: 'Device type' },
  { value: 'country_code', icon: <EarthIcon />, label: 'Country code' },
  { value: 'subdivision_code', icon: <MapPinIcon />, label: 'Region' },
  { value: 'city', icon: <Building2Icon />, label: 'City' },
  { value: 'browser', icon: <CompassIcon />, label: 'Browser' },
  { value: 'os', icon: <MonitorSmartphoneIcon />, label: 'Operating system' },
  { value: 'custom_event_name', icon: <SunsetIcon />, label: 'Event' },
  { value: 'referrer_source', icon: <StepBackIcon />, label: 'Referrer source' },
  { value: 'referrer_source_name', icon: <BatteryIcon />, label: 'Referrer name' },
  { value: 'referrer_search_term', icon: <ShellIcon />, label: 'Referrer term' },
  { value: 'referrer_url', icon: <ExternalLinkIcon />, label: 'Referrer URL' },
  { value: 'utm_source', icon: <ArrowRightToLineIcon />, label: 'UTM source' },
  { value: 'utm_medium', icon: <CableIcon />, label: 'UTM medium' },
  { value: 'utm_campaign', icon: <FileTextIcon />, label: 'UTM campaign' },
  { value: 'utm_term', icon: <TextSearchIcon />, label: 'UTM term' },
  { value: 'utm_content', icon: <SquareMousePointerIcon />, label: 'UTM content' },
];
