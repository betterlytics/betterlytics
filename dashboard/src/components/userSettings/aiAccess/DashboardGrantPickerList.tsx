'use client';

import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DomainFavicon } from '@/components/domain/DomainFavicon';
import type { useDashboardGrantPicker } from '@/hooks/use-dashboard-grant-picker';
import type { McpConnectionsOverview } from '@/services/auth/mcpConnections.service';
import { cn } from '@/lib/utils';

type PickerDashboard = McpConnectionsOverview['dashboards'][number];

interface DashboardGrantPickerListProps {
  picker: ReturnType<typeof useDashboardGrantPicker<PickerDashboard>>;
  onCloseDialog: () => void;
}

/** The searchable dashboard checklist of the edit dashboards and create token dialogs. */
export default function DashboardGrantPickerList({ picker, onCloseDialog }: DashboardGrantPickerListProps) {
  const t = useTranslations('components.userSettings.aiAccess.editDialog');
  const tRoles = useTranslations('members.roles');

  return picker.total === 0 ? (
    <p className='text-muted-foreground text-sm'>
      {t.rich('empty', {
        link: (chunks) => (
          <NextLink
            href='/dashboards'
            onClick={onCloseDialog}
            className='text-primary underline underline-offset-2'
          >
            {chunks}
          </NextLink>
        ),
      })}
    </p>
  ) : (
    <div className={cn('rounded-md border', picker.allDashboards && 'opacity-60')}>
      {picker.searchable && (
        <div className='relative border-b p-2'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
          <Input
            type='search'
            value={picker.query}
            onChange={(event) => picker.setQuery(event.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className='pl-8'
          />
        </div>
      )}
      <div className='flex items-center justify-between gap-3 border-b px-3 py-2'>
        <label className='flex cursor-pointer items-center gap-2 text-sm'>
          <Checkbox
            checked={picker.selectAllState}
            disabled={picker.allDashboards || picker.visible.length === 0}
            onCheckedChange={() => picker.toggleVisible(picker.visiblePicked < picker.visible.length)}
          />
          {t('selectAll')}
        </label>
        <span className='text-muted-foreground text-xs' aria-live='polite'>
          {picker.allDashboards
            ? t('allHint')
            : picker.picked.size === 0
              ? t('pickOne')
              : t('selected', { selected: picker.picked.size, total: picker.total })}
        </span>
      </div>
      <div className='max-h-64 overflow-y-auto'>
        {picker.visible.length === 0 && (
          <p className='text-muted-foreground px-3 py-4 text-center text-sm'>{t('noMatch')}</p>
        )}
        {picker.visible.map((dashboard) => (
          <label
            key={dashboard.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm',
              picker.allDashboards ? 'cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer',
            )}
          >
            <Checkbox
              checked={picker.allDashboards || picker.picked.has(dashboard.id)}
              disabled={picker.allDashboards}
              onCheckedChange={(on) => picker.togglePicked(dashboard.id, on === true)}
            />
            <DomainFavicon domain={dashboard.domain} size={16} />
            <span className='min-w-0 flex-1 truncate' title={dashboard.domain}>
              {dashboard.domain}
            </span>
            <Badge variant='outline' className='text-muted-foreground shrink-0'>
              {tRoles(dashboard.role)}
            </Badge>
          </label>
        ))}
      </div>
    </div>
  );
}
