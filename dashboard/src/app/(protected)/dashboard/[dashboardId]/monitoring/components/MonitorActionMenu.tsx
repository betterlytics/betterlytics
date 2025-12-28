'use client';

import { useState } from 'react';
import { MoreHorizontal, MoreVertical, Pencil, Settings, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DestructiveActionDialog } from '@/components/dialogs';
import { type MonitorCheck, MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { useMonitorMutations } from '../[monitorId]/(EditMonitorSheet)/hooks/useMonitorMutations';
import { EditMonitorSheet } from '../[monitorId]/(EditMonitorSheet)/EditMonitorSheet';
import { useTranslations } from 'next-intl';

type MonitorActionMenuProps = {
  monitor: MonitorCheck;
  dashboardId: string;
  vertical?: boolean;
};

export function MonitorActionMenu({ monitor, dashboardId, vertical = false }: MonitorActionMenuProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newName, setNewName] = useState(monitor.name ?? '');

  const t = useTranslations('monitoringPage.actions');
  const tMisc = useTranslations('misc');
  const tMonitorActions = useTranslations('monitoring.actions');

  const { statusMutation, renameMutation, deleteMutation } = useMonitorMutations(dashboardId, monitor.id);

  const handleRename = () => {
    const trimmedName = newName.trim() || null;
    if (trimmedName === (monitor.name ?? null)) {
      setShowRenameDialog(false);
      return;
    }
    renameMutation.mutate(
      { monitorId: monitor.id, name: trimmedName },
      {
        onSuccess: () => setShowRenameDialog(false),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => setShowDeleteDialog(false),
    });
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    statusMutation.mutate({ monitorId: monitor.id, isEnabled: !monitor.isEnabled });
  };

  const openRenameDialog = () => {
    setNewName(monitor.name ?? '');
    setShowRenameDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className='text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer transition-colors'
          >
            {vertical ? <MoreVertical className='h-4 w-4' /> : <MoreHorizontal className='h-4 w-4' />}
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={statusMutation.isPending}
            className='cursor-pointer'
          >
            {monitor.isEnabled ? (
              <>
                <PauseCircle className='mr-2 h-4 w-4' />
                {statusMutation.isPending ? tMonitorActions('pausing') : tMonitorActions('pause')}
              </>
            ) : (
              <>
                <PlayCircle className='mr-2 h-4 w-4' />
                {statusMutation.isPending ? tMonitorActions('resuming') : tMonitorActions('resume')}
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openRenameDialog();
            }}
            className='cursor-pointer'
          >
            <Pencil className='mr-2 h-4 w-4' />
            {tMisc('rename')}
          </DropdownMenuItem>

          <EditMonitorSheet
            dashboardId={dashboardId}
            monitor={monitor as any}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='cursor-pointer'>
                <Settings className='mr-2 h-4 w-4' />
                {t('settings')}
              </DropdownMenuItem>
            }
          />

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            variant='destructive'
            className='cursor-pointer'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {tMisc('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className='sm:max-w-md' onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('renameTitle')}</DialogTitle>
            <DialogDescription className='sr-only'>{t('renameTitle')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='monitor-name'>{t('renamePlaceholder')}</Label>
              <Input
                id='monitor-name'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('renamePlaceholder')}
                maxLength={MONITOR_LIMITS.NAME_MAX}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowRenameDialog(false)} className='cursor-pointer'>
              {tMisc('cancel')}
            </Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending} className='cursor-pointer'>
              {renameMutation.isPending ? tMisc('renaming') : tMisc('rename')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DestructiveActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDescription')}
        cancelLabel={tMisc('cancel')}
        confirmLabel={tMisc('delete')}
        pendingLabel={tMisc('deleting')}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
        onClick={(e) => e.stopPropagation()}
      />
    </>
  );
}
