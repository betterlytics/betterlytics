import { FilterColumn, FilterOperator, QueryFilter } from '@/entities/filter';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { useQuery } from '@tanstack/react-query';
import { getFilterUIConfigAction, getFilterOptionsAction } from '@/app/actions/filters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { Combobox } from '@/components/ui/combobox';
import { Dispatch, ReactNode, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations } from 'next-intl';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import {
  ArrowRightToLineIcon,
  BatteryIcon,
  CableIcon,
  CompassIcon,
  EarthIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MonitorSmartphoneIcon,
  ShellIcon,
  SquareMousePointerIcon,
  StepBackIcon,
  SunsetIcon,
  TabletSmartphoneIcon,
  TextCursorInputIcon,
  TextSearchIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const { startDate, endDate } = useTimeRangeContext();
  const dashboardId = useDashboardId();

  const { data: filterUIConfig } = useQuery({
    queryKey: ['filter-ui-config'],
    queryFn: () => getFilterUIConfigAction(dashboardId),
    staleTime: 5 * 60 * 1000,
  });
  const cfg = filterUIConfig?.[filter.column];

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const shouldFetch = Boolean(cfg?.serverFetch) && Boolean(startDate) && Boolean(endDate);

  const { data: options = [], isLoading: optionsLoading } = useQuery({
    queryKey: [
      'filter-options',
      filter.column,
      startDate?.toString(),
      endDate?.toString(),
      debouncedSearch,
    ],
    queryFn: async () =>
      getFilterOptionsAction(dashboardId, {
        startDate,
        endDate,
        column: filter.column,
        search: debouncedSearch || undefined,
        limit: 10,
      }),
    enabled: shouldFetch,
  });
  return (
    <div className='grid grid-cols-12 grid-rows-2 gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <Select
        value={filter.column}
        onValueChange={(column: FilterColumn) => onFilterUpdate({ ...filter, column })}
      >
        <SelectTrigger className='col-span-8 w-full cursor-pointer md:col-span-4'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align={'start'}
          position={'popper'}
          className={cn('w-[--radix-select-trigger-width]', isMobile && 'max-h-72')}
        >
          <SelectGroup>
            <SelectLabel>{t('type')}</SelectLabel>
            {FILTER_COLUMN_SELECT_OPTIONS.map((column) => (
              <SelectItem className='cursor-pointer' key={column.value} value={column.value}>
                {column.icon}
                {t(`columns.${column.value}`)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
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
      {(() => {
        if (!cfg || cfg.input === 'text') {
          return (
            <Input
              className='col-span-10 md:col-span-5'
              value={filter.value}
              onChange={(evt) => onFilterUpdate({ ...filter, value: evt.target.value })}
            />
          );
        }

        if (cfg.serverFetch === false && Array.isArray(cfg.options)) {
          return (
            <Combobox
              className='col-span-10 md:col-span-5'
              value={filter.value}
              onValueChange={(value) => onFilterUpdate({ ...filter, value })}
              options={cfg.options}
              enableSearch={false}
              placeholder='Select value'
            />
          );
        }

        return (
          <Combobox
            className='col-span-10 md:col-span-5'
            value={filter.value}
            onValueChange={(value) => onFilterUpdate({ ...filter, value })}
            options={options}
            searchQuery={cfg.search ? search : undefined}
            onSearchChange={cfg.search ? setSearch : undefined}
            loading={optionsLoading}
            placeholder='Select value'
            searchPlaceholder='Search…'
            enableSearch={Boolean(cfg.search)}
          />
        );
      })()}
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

const FILTER_COLUMN_SELECT_OPTIONS: FilterColumnSelectOptions = [
  { value: 'url', icon: <TextCursorInputIcon />, label: 'URL' },
  { value: 'device_type', icon: <TabletSmartphoneIcon />, label: 'Device type' },
  { value: 'country_code', icon: <EarthIcon />, label: 'Country code' },
  { value: 'browser', icon: <CompassIcon />, label: 'Browser' },
  { value: 'os', icon: <MonitorSmartphoneIcon />, label: 'Operating system' },
  { value: 'referrer_source', icon: <StepBackIcon />, label: 'Referrer source' },
  { value: 'referrer_source_name', icon: <BatteryIcon />, label: 'Referrer name' },
  { value: 'referrer_search_term', icon: <ShellIcon />, label: 'Referrer term' },
  { value: 'referrer_url', icon: <ExternalLinkIcon />, label: 'Referrer URL' },
  { value: 'utm_source', icon: <ArrowRightToLineIcon />, label: 'UTM source' },
  { value: 'utm_medium', icon: <CableIcon />, label: 'UTM medium' },
  { value: 'utm_campaign', icon: <FileTextIcon />, label: 'UTM campaign' },
  { value: 'utm_term', icon: <TextSearchIcon />, label: 'UTM term' },
  { value: 'utm_content', icon: <SquareMousePointerIcon />, label: 'UTM content' },
  { value: 'custom_event_name', icon: <SunsetIcon />, label: 'Event' },
];
