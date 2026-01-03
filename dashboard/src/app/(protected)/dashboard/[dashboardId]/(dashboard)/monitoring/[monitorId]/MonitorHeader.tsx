'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { EditableLabel } from '@/components/inputs/EditableLabel';
import { MONITOR_LIMITS, type MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { presentMonitorStatus } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { MonitorStatusBadge } from '../components/MonitorStatusBadge';

type MonitorHeaderProps = {
  monitorName: string;
  url: string;
  operationalState: MonitorOperationalState;
  actionSlot?: ReactNode;
  onRename?: (name: string | null) => void;
  isRenaming?: boolean;
};

export function MonitorHeader({
  monitorName,
  url,
  operationalState,
  actionSlot,
  onRename,
  isRenaming,
}: MonitorHeaderProps) {
  const tHeader = useTranslations('monitoringDetailPage.header');
  const presentation = presentMonitorStatus(operationalState);

  return (
    <div className='space-y-2 px-1 pt-1 sm:space-y-3 sm:px-0'>
      <FilterPreservingLink
        href='monitoring'
        className='text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs font-medium transition sm:text-sm'
      >
        <ChevronLeft className='h-4 w-4' />
        <span className='cursor-pointer'>{tHeader('back')}</span>
      </FilterPreservingLink>

      <div className='flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex shrink-0 items-center pt-1'>
              <MonitorStatusBadge presentation={presentation} compact className='sm:hidden' />
              <MonitorStatusBadge presentation={presentation} className='hidden sm:inline-flex' />
            </div>
            <div className='min-w-0 flex-1 space-y-0.5'>
              <EditableLabel
                value={monitorName}
                onSubmit={onRename}
                disabled={isRenaming}
                placeholder='Monitor name'
                maxLength={MONITOR_LIMITS.NAME_MAX}
                textClassName='text-xl font-semibold leading-tight sm:text-2xl truncate'
                inputClassName='min-w-[150px]'
              />
              <a
                href={url}
                target='_blank'
                rel='noreferrer'
                className='text-muted-foreground hover:text-foreground block max-w-[250px] truncate pl-0.5 text-xs transition hover:underline sm:max-w-none sm:text-sm'
                title={url}
              >
                {url}
              </a>
            </div>
            {/* Mobile action slot */}
            <div className='shrink-0 sm:hidden'>{actionSlot}</div>
          </div>
        </div>
        <div className='hidden sm:block'>{actionSlot}</div>
      </div>
    </div>
  );
}
