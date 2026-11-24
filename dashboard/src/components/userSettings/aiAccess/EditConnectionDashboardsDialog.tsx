'use client';

import { useId, useTransition } from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DomainFavicon } from '@/components/domain/DomainFavicon';
import { updateMcpConnectionDashboardsAction } from '@/app/actions/account/mcpConnections.action';
import { useDashboardGrantPicker } from '@/hooks/use-dashboard-grant-picker';
import type { McpConnection, McpConnectionsOverview } from '@/services/auth/mcpConnections.service';
import { cn } from '@/lib/utils';

interface EditConnectionDashboardsDialogProps {
  connection: McpConnection;
  dashboards: McpConnectionsOverview['dashboards'];
  onSaved: () => Promise<unknown>;
  onClose: () => void;
  onCloseDialog: () => void;
}

export default function EditConnectionDashboardsDialog({
  connection,
  dashboards,
  onSaved,
  onClose,
  onCloseDialog,
}: EditConnectionDashboardsDialogProps) {
  const t = useTranslations('components.userSettings.aiAccess.editDialog');
  const tToast = useTranslations('components.userSettings.aiAccess.toast');
  const tDialog = useTranslations('components.userSettings.dialog');
  const tRoles = useTranslations('members.roles');
  const id = useId();
  const [isPending, startTransition] = useTransition();

  const picker = useDashboardGrantPicker(dashboards, {
    allDashboards: connection.allDashboards,
    dashboardIds: connection.dashboards.map((dashboard) => dashboard.id),
  });

  const handleSave = () => {
    if (!picker.canSave) return;
    startTransition(async () => {
      const result = await updateMcpConnectionDashboardsAction(connection.clientId, picker.selection);
      if (result.success) {
        await onSaved();
        toast.success(tToast('dashboardsUpdated', { name: connection.name }));
        onClose();
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('title', { name: connection.name })}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <fieldset className='min-w-0 space-y-3' disabled={isPending}>
          <div role='radiogroup' aria-label={t('title', { name: connection.name })} className='flex gap-2'>
            {[true, false].map((all) => (
              <label
                key={String(all)}
                className={cn(
                  'has-[:focus-visible]:ring-ring/50 flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium transition-[color,background-color,box-shadow] has-[:focus-visible]:ring-[3px]',
                  picker.allDashboards === all
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50',
                )}
              >
                <input
                  type='radio'
                  className='sr-only'
                  name={`${id}-scope`}
                  checked={picker.allDashboards === all}
                  onChange={() => picker.setAllDashboards(all)}
                />
                {all ? t('modeAll') : t('modeSelected')}
              </label>
            ))}
          </div>

          {picker.total === 0 ? (
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
          )}
        </fieldset>

        <DialogFooter>
          <Button variant='outline' className='cursor-pointer' onClick={onClose} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button className='cursor-pointer' onClick={handleSave} disabled={isPending || !picker.canSave}>
            {isPending ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
