import { FILTER_COLUMNS } from '@/entities/analytics/filter.entities';
import {
  ArrowRightToLineIcon,
  ArrowUpRightIcon,
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
} from 'lucide-react';
import { type ReactNode } from 'react';

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
  { value: 'outbound_link_url', icon: <ArrowUpRightIcon />, label: 'Outbound link' },
  { value: 'referrer_source', icon: <StepBackIcon />, label: 'Referrer source' },
  { value: 'referrer_source_name', icon: <BatteryIcon />, label: 'Referrer name' },
  { value: 'referrer_search_term', icon: <ShellIcon />, label: 'Referrer term' },
  { value: 'referrer_url', icon: <ExternalLinkIcon />, label: 'Referrer URL' },
  { value: 'utm_source', icon: <ArrowRightToLineIcon />, label: 'UTM source' },
  { value: 'utm_medium', icon: <CableIcon />, label: 'UTM medium' },
  { value: 'utm_campaign', icon: <FileTextIcon />, label: 'UTM campaign' },
  { value: 'utm_term', icon: <TextSearchIcon />, label: 'UTM term' },
  { value: 'utm_content', icon: <SquareMousePointerIcon />, label: 'UTM content' },
] as const satisfies FilterColumnSelectOptions;
