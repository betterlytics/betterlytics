'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Filter, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  type MonitorStatus,
  type MonitorTlsResult,
  type MonitorUptimeBucket,
} from '@/entities/analytics/monitoring.entities';
import { CreateMonitorDialog } from './CreateMonitorDialog';
import { MonitorList } from './MonitorList';
import { presentSslStatus } from '@/utils/monitoringStyles';

type MonitorView = {
  id: string;
  dashboardId: string;
  name?: string | null;
  url: string;
  intervalSeconds?: number;
  effectiveIntervalSeconds?: number | null;
  backoffLevel?: number | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isEnabled: boolean;
  lastStatus?: MonitorStatus | null;
  uptimeBuckets?: MonitorUptimeBucket[];
  tls?: MonitorTlsResult | null;
};

type FiltersCopy = {
  statusLabel: string;
  sortLabel: string;
  statusAll: string;
  statusUp: string;
  statusDown: string;
  statusSslExpiring: string;
  statusPaused: string;
  statusNotStarted: string;
  sortDownFirst: string;
  sortUpFirst: string;
  sortNewest: string;
  sortOldest: string;
  sortNameAsc: string;
  sortNameDesc: string;
  sortSslExpires: string;
};

type StatusFilter = 'all' | 'up' | 'down' | 'ssl' | 'paused' | 'notStarted';
type SortKey = 'downFirst' | 'upFirst' | 'newest' | 'oldest' | 'nameAsc' | 'nameDesc' | 'ssl';

const STATUS_LABEL_KEY: Record<StatusFilter, keyof FiltersCopy> = {
  all: 'statusAll',
  up: 'statusUp',
  down: 'statusDown',
  ssl: 'statusSslExpiring',
  paused: 'statusPaused',
  notStarted: 'statusNotStarted',
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

type MonitoringClientProps = {
  dashboardId: string;
  monitors: MonitorView[];
};

export function MonitoringClient({ dashboardId, monitors }: MonitoringClientProps) {
  const t = useTranslations('monitoringPage');
  const filtersCopy = useMemo<FiltersCopy>(
    () => ({
      statusLabel: t('filters.statusLabel'),
      sortLabel: t('filters.sortLabel'),
      statusAll: t('filters.statusAll'),
      statusUp: t('filters.statusUp'),
      statusDown: t('filters.statusDown'),
      statusSslExpiring: t('filters.statusSslExpiring'),
      statusPaused: t('filters.statusPaused'),
      statusNotStarted: t('filters.statusNotStarted'),
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
        const sslStatus = presentSslStatus({
          status: monitor.tls?.status,
          daysLeft: monitor.tls?.tlsDaysLeft ?? null,
        });
        if (statusFilter === 'paused') return !monitor.isEnabled;
        if (statusFilter === 'up') return monitor.isEnabled && monitor.lastStatus === 'ok';
        if (statusFilter === 'down')
          return monitor.isEnabled && (monitor.lastStatus === 'down' || monitor.lastStatus === 'error');
        if (statusFilter === 'ssl')
          return sslStatus.category === 'warn' || sslStatus.category === 'down' || sslStatus.category === 'error';
        if (statusFilter === 'notStarted')
          return monitor.isEnabled && !monitor.lastStatus && !monitor.uptimeBuckets?.length;
        return true;
      }),
    [monitors, statusFilter],
  );

  const sortedMonitors = useMemo(() => {
    const statusRankDown = (monitor: MonitorView) => {
      if (!monitor.isEnabled) return 4;
      const map: Record<string, number> = { down: 0, error: 0, warn: 1, ok: 2 };
      return map[monitor.lastStatus ?? ''] ?? 3;
    };
    const statusRankUp = (monitor: MonitorView) => -statusRankDown(monitor);
    const nameValue = (monitor: MonitorView) => (monitor.name || monitor.url || '').toLowerCase();
    const createdAtMs = (monitor: MonitorView) =>
      monitor.createdAt ? new Date(monitor.createdAt).getTime() : Number.NEGATIVE_INFINITY;
    const sslDays = (monitor: MonitorView) =>
      presentSslStatus({ status: monitor.tls?.status, daysLeft: monitor.tls?.tlsDaysLeft ?? null }).category ===
      'unknown'
        ? Number.POSITIVE_INFINITY
        : (monitor.tls?.tlsDaysLeft ?? Number.POSITIVE_INFINITY);

    return [...filteredMonitors].sort((a, b) => {
      switch (sortKey) {
        case 'downFirst':
          return statusRankDown(a) - statusRankDown(b) || nameValue(a).localeCompare(nameValue(b));
        case 'upFirst':
          return statusRankUp(a) - statusRankUp(b) || nameValue(a).localeCompare(nameValue(b));
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
              <SelectTrigger size='sm' className='w-auto'>
                <FilterSelectValue label={statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{filtersCopy.statusAll}</SelectItem>
                <SelectItem value='up'>{filtersCopy.statusUp}</SelectItem>
                <SelectItem value='down'>{filtersCopy.statusDown}</SelectItem>
                <SelectItem value='ssl'>{filtersCopy.statusSslExpiring}</SelectItem>
                <SelectItem value='paused'>{filtersCopy.statusPaused}</SelectItem>
                <SelectItem value='notStarted'>{filtersCopy.statusNotStarted}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger size='sm' className='w-auto'>
                <FilterSelectValue label={sortLabel} Icon={ArrowUpDown} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='downFirst'>{filtersCopy.sortDownFirst}</SelectItem>
                <SelectItem value='upFirst'>{filtersCopy.sortUpFirst}</SelectItem>
                <SelectItem value='newest'>{filtersCopy.sortNewest}</SelectItem>
                <SelectItem value='oldest'>{filtersCopy.sortOldest}</SelectItem>
                <SelectItem value='nameAsc'>{filtersCopy.sortNameAsc}</SelectItem>
                <SelectItem value='nameDesc'>{filtersCopy.sortNameDesc}</SelectItem>
                <SelectItem value='ssl'>{filtersCopy.sortSslExpires}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='bg-border h-6 w-px' aria-hidden />
          <CreateMonitorDialog dashboardId={dashboardId} />
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
