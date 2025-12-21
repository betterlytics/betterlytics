import { FilterColumn, FilterOperator, QueryFilter } from '@/entities/analytics/filter.entities';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Dispatch, ReactNode, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowRightToLineIcon,
  BatteryIcon,
  CableIcon,
  CompassIcon,
  EarthIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
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
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FilterValueSearch } from './FilterValueSearch';
import { useDemoMode } from '@/contexts/DemoModeContextProvider';

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
  const isDemo = useDemoMode();
  const demoAllowedColumns = new Set<FilterColumn>(['url', 'device_type']);

  const filterColumnRef = useRef<string>(filter.column);
  useEffect(() => {
    if (filter.column !== filterColumnRef.current) {
      onFilterUpdate({ ...filter, value: '' });
      filterColumnRef.current = filter.column;
    }
  }, [filter.column]);

  return (
    <div className='grid grid-cols-12 grid-rows-2 gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <Select
        value={filter.column}
        onValueChange={(column: FilterColumn) => {
          if (isDemo && !demoAllowedColumns.has(column)) return;
          onFilterUpdate({ ...filter, column });
        }}
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
            {FILTER_COLUMN_SELECT_OPTIONS.map((column) => {
              const disabled = isDemo && !demoAllowedColumns.has(column.value as FilterColumn);
              return (
                <SelectItem className='cursor-pointer' key={column.value} value={column.value} disabled={disabled}>
                  {column.icon}
                  {t(`columns.${column.value}`)}
                  {disabled && (
                    <span className='text-muted-foreground ml-auto text-xs'>{tDemo('notAvailable')}</span>
                  )}
                </SelectItem>
              );
            })}
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
