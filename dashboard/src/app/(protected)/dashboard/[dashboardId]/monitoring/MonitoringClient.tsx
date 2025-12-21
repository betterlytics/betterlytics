'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Filter, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { type MonitorOperationalState, type MonitorWithStatus } from '@/entities/analytics/monitoring.entities';
import { CreateMonitorDialog } from './CreateMonitorDialog';
import { MonitorList } from './MonitorList';
import { presentSslStatus } from '@/app/(protected)/dashboard/[dashboardId]/monitoring/monitoringStyles';

type FiltersCopy = {
  statusLabel: string;
  sortLabel: string;
  statusAll: string;
  statusUp: string;
  statusDegraded: string;
  statusDown: string;
  statusSslExpiring: string;
  statusPaused: string;
  statusPreparing: string;
  sortDownFirst: string;
  sortUpFirst: string;
  sortNewest: string;
  sortOldest: string;
  sortNameAsc: string;
  sortNameDesc: string;
  sortSslExpires: string;
};

type StatusFilter = MonitorOperationalState | 'all' | 'ssl';
type SortKey = 'downFirst' | 'upFirst' | 'newest' | 'oldest' | 'nameAsc' | 'nameDesc' | 'ssl';

const STATUS_LABEL_KEY: Record<StatusFilter, keyof FiltersCopy> = {
  all: 'statusAll',
  up: 'statusUp',
  degraded: 'statusDegraded',
  down: 'statusDown',
  ssl: 'statusSslExpiring',
  paused: 'statusPaused',
  preparing: 'statusPreparing',
};

const SORT_LABEL_KEY: Record<SortKey, keyof FiltersCopy> = {
  downFirst: 'sortDownFirst',
  upFirst: 'sortUpFirst',
  newest: 'sortNewest',
  oldest: 'sortOldest',
  nameAsc: 'sortNameAsc',
  nameDesc: 'sortNameDesc',
  ssl: 'sortSslExpires',
};

/** Maps status filter to matching operational states */
const STATUS_FILTER_STATES: Record<StatusFilter, MonitorOperationalState[] | null> = {
  all: null, // null means match all
  up: ['up'],
  degraded: ['degraded'],
  down: ['down'],
  paused: ['paused'],
  preparing: ['preparing'],
  ssl: null, // SSL filter uses different logic
};

const OPERATIONAL_STATE_PRIORITY: Record<MonitorOperationalState, number> = {
  down: 0,
  degraded: 1,
  up: 2,
  preparing: 3,
  paused: 4,
};

type MonitoringClientProps = {
  dashboardId: string;
  monitors: MonitorWithStatus[];
  domain: string;
};

export function MonitoringClient({ dashboardId, monitors, domain }: MonitoringClientProps) {
  const t = useTranslations('monitoringPage');
  const filtersCopy = useMemo<FiltersCopy>(
    () => ({
      statusLabel: t('filters.statusLabel'),
      sortLabel: t('filters.sortLabel'),
      statusAll: t('filters.statusAll'),
      statusUp: t('filters.statusUp'),
      statusDegraded: t('filters.statusDegraded'),
      statusDown: t('filters.statusDown'),
      statusSslExpiring: t('filters.statusSslExpiring'),
      statusPaused: t('filters.statusPaused'),
      statusPreparing: t('filters.statusPreparing'),
      sortDownFirst: t('filters.sortDownFirst'),
      sortUpFirst: t('filters.sortUpFirst'),
      sortNewest: t('filters.sortNewest'),
      sortOldest: t('filters.sortOldest'),
      sortNameAsc: t('filters.sortNameAsc'),
      sortNameDesc: t('filters.sortNameDesc'),
      sortSslExpires: t('filters.sortSslExpires'),
    }),
    [t],
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('downFirst');

  const filteredMonitors = useMemo(
    () =>
      monitors.filter((monitor) => {
        // SSL filter uses different logic based on TLS status
        if (statusFilter === 'ssl') {
          const sslStatus = presentSslStatus({
            status: monitor.tls?.status,
            daysLeft: monitor.tls?.tlsDaysLeft ?? null,
          });
          return sslStatus.category === 'warn' || sslStatus.category === 'down' || sslStatus.category === 'error';
        }

        // All other filters use operationalState directly
        const allowedStates = STATUS_FILTER_STATES[statusFilter];
        if (allowedStates === null) return true;
        return allowedStates.includes(monitor.operationalState);
      }),
    [monitors, statusFilter],
  );

  const sortedMonitors = useMemo(() => {
    const nameValue = (monitor: MonitorWithStatus) => (monitor.name || monitor.url || '').toLowerCase();
    const createdAtMs = (monitor: MonitorWithStatus) =>
      monitor.createdAt ? new Date(monitor.createdAt).getTime() : Number.NEGATIVE_INFINITY;
    const sslDays = (monitor: MonitorWithStatus) =>
      presentSslStatus({ status: monitor.tls?.status, daysLeft: monitor.tls?.tlsDaysLeft ?? null }).category ===
      'unknown'
        ? Number.POSITIVE_INFINITY
        : (monitor.tls?.tlsDaysLeft ?? Number.POSITIVE_INFINITY);

    return [...filteredMonitors].sort((a, b) => {
      switch (sortKey) {
        case 'downFirst': {
          const priorityDiff =
            OPERATIONAL_STATE_PRIORITY[a.operationalState] - OPERATIONAL_STATE_PRIORITY[b.operationalState];
          return priorityDiff !== 0 ? priorityDiff : nameValue(a).localeCompare(nameValue(b));
        }
        case 'upFirst': {
          const priorityDiff =
            OPERATIONAL_STATE_PRIORITY[b.operationalState] - OPERATIONAL_STATE_PRIORITY[a.operationalState];
          return priorityDiff !== 0 ? priorityDiff : nameValue(a).localeCompare(nameValue(b));
        }
        case 'newest':
          return createdAtMs(b) - createdAtMs(a) || nameValue(a).localeCompare(nameValue(b));
        case 'oldest':
          return createdAtMs(a) - createdAtMs(b) || nameValue(a).localeCompare(nameValue(b));
        case 'nameDesc':
          return nameValue(b).localeCompare(nameValue(a));
        case 'ssl':
          return sslDays(a) - sslDays(b) || nameValue(a).localeCompare(nameValue(b));
        case 'nameAsc':
        default:
          return nameValue(a).localeCompare(nameValue(b));
      }
    });
  }, [filteredMonitors, sortKey]);

  const statusLabel = useMemo(
    () => filtersCopy[STATUS_LABEL_KEY[statusFilter]] ?? filtersCopy.statusLabel,
    [filtersCopy, statusFilter],
  );

  const sortLabel = useMemo(
    () => filtersCopy[SORT_LABEL_KEY[sortKey]] ?? filtersCopy.sortLabel,
    [filtersCopy, sortKey],
  );

  return (
    <div className='space-y-4'>
      <DashboardHeader title={t('title')}>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center gap-2'>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className='w-auto cursor-pointer'>
                <FilterSelectValue label={statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all' className='cursor-pointer'>
                  {filtersCopy.statusAll}
                </SelectItem>
                <SelectItem value='up' className='cursor-pointer'>
                  {filtersCopy.statusUp}
                </SelectItem>
                <SelectItem value='degraded' className='cursor-pointer'>
                  {filtersCopy.statusDegraded}
                </SelectItem>
                <SelectItem value='down' className='cursor-pointer'>
                  {filtersCopy.statusDown}
                </SelectItem>
                <SelectItem value='ssl' className='cursor-pointer'>
                  {filtersCopy.statusSslExpiring}
                </SelectItem>
                <SelectItem value='paused' className='cursor-pointer'>
                  {filtersCopy.statusPaused}
                </SelectItem>
                <SelectItem value='preparing' className='cursor-pointer'>
                  {filtersCopy.statusPreparing}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className='w-auto cursor-pointer'>
                <FilterSelectValue label={sortLabel} Icon={ArrowUpDown} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='downFirst' className='cursor-pointer'>
                  {filtersCopy.sortDownFirst}
                </SelectItem>
                <SelectItem value='upFirst' className='cursor-pointer'>
                  {filtersCopy.sortUpFirst}
                </SelectItem>
                <SelectItem value='newest' className='cursor-pointer'>
                  {filtersCopy.sortNewest}
                </SelectItem>
                <SelectItem value='oldest' className='cursor-pointer'>
                  {filtersCopy.sortOldest}
                </SelectItem>
                <SelectItem value='nameAsc' className='cursor-pointer'>
                  {filtersCopy.sortNameAsc}
                </SelectItem>
                <SelectItem value='nameDesc' className='cursor-pointer'>
                  {filtersCopy.sortNameDesc}
                </SelectItem>
                <SelectItem value='ssl' className='cursor-pointer'>
                  {filtersCopy.sortSslExpires}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='bg-border h-6 w-px' aria-hidden />
          <CreateMonitorDialog
            dashboardId={dashboardId}
            domain={domain}
            existingUrls={monitors.map((m) => m.url)}
          />
        </div>
      </DashboardHeader>

      <MonitorList monitors={sortedMonitors} />
    </div>
  );
}

function FilterSelectValue({ label, Icon = Filter }: { label: string; Icon?: LucideIcon }) {
  return (
    <div className='flex items-center gap-1'>
      <Icon className='h-3.5 w-3.5 opacity-60' />
      <span className='truncate'>{label}</span>
    </div>
  );
}
