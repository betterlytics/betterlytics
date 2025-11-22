import { FilterColumn, FilterOperator, QueryFilter } from '@/entities/filter';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { FilterValueSearch } from '@/components/filters/FilterValueSearch';
import { Input } from '@/components/ui/input';

type FunnelStepFilterProps = {
  onFilterUpdate: Dispatch<QueryFilter & { name: string }>;
  filter: QueryFilter & { name: string };
  requestRemoval: Dispatch<QueryFilter & { name: string }>;
  disableDeletion?: boolean;
};

export function FunnelStepFilter({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
}: FunnelStepFilterProps) {
  const isMobile = useIsMobile();
  const t = useTranslations('components.filters');

  const filterColumnRef = useRef<string>(filter.column);
  useEffect(() => {
    if (filter.column !== filterColumnRef.current) {
      onFilterUpdate({ ...filter, value: '' });
      filterColumnRef.current = filter.column;
    }
  }, [filter.column]);

  return (
    <div className='grid grid-cols-12 grid-rows-2 gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <Input
        className='col-span-4 w-full cursor-pointer md:col-span-2'
        value={filter.name}
        onChange={(e) => onFilterUpdate({ ...filter, name: e.target.value })}
      />
      <Select
        value={filter.column}
        onValueChange={(column: FilterColumn) => {
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
              return (
                <SelectItem className='cursor-pointer' key={column.value} value={column.value}>
                  {column.icon}
                  {t(`columns.${column.value}`)}
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
      <FilterValueSearch filter={filter} onFilterUpdate={onFilterUpdate} key={filter.column} />
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

type FilterColumnSelectOptions = { value: FilterColumn; icon: ReactNode }[];

const FILTER_COLUMN_SELECT_OPTIONS: FilterColumnSelectOptions = [
  { value: 'url', icon: <TextCursorInputIcon /> },
  { value: 'device_type', icon: <TabletSmartphoneIcon /> },
  { value: 'country_code', icon: <EarthIcon /> },
  { value: 'browser', icon: <CompassIcon /> },
  { value: 'os', icon: <MonitorSmartphoneIcon /> },
  { value: 'referrer_source', icon: <StepBackIcon /> },
  { value: 'referrer_source_name', icon: <BatteryIcon /> },
  { value: 'referrer_search_term', icon: <ShellIcon /> },
  { value: 'referrer_url', icon: <ExternalLinkIcon /> },
  { value: 'utm_source', icon: <ArrowRightToLineIcon /> },
  { value: 'utm_medium', icon: <CableIcon /> },
  { value: 'utm_campaign', icon: <FileTextIcon /> },
  { value: 'utm_term', icon: <TextSearchIcon /> },
  { value: 'utm_content', icon: <SquareMousePointerIcon /> },
  { value: 'custom_event_name', icon: <SunsetIcon /> },
];
