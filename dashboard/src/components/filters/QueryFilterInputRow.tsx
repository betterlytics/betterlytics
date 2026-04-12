import { FILTER_COLUMNS, type FilterColumn, type QueryFilter } from '@/entities/analytics/filter.entities';
import { Dispatch, ReactNode } from 'react';
import {
  ArrowRightToLineIcon,
  BatteryIcon,
  Building2Icon,
  CableIcon,
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
  TextCursorInputIcon,
  TextSearchIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterValueSearch } from './FilterValueSearch';
import { FilterColumnDropdown } from './FilterColumnDropdown';
import { FilterOperatorSelector } from './FilterOperatorSelector';

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
  return (
    <div className='grid grid-cols-12 items-start gap-1 rounded border p-1 md:grid-rows-1 md:border-0'>
      <FilterColumnDropdown
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        className='col-span-8 md:col-span-4'
      />
      <FilterOperatorSelector
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        className='col-span-4 w-full cursor-pointer md:col-span-2'
      />
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

type StandardFilterColumn = (typeof FILTER_COLUMNS)[number];
type FilterColumnSelectOptions = { value: StandardFilterColumn; icon: ReactNode; label: string }[];

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
