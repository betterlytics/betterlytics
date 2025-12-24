'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Settings, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { type MonitorWithStatus, MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { useMonitorMutations } from '../[monitorId]/(EditMonitorSheet)/hooks/useMonitorMutations';
import { EditMonitorDialog } from '../[monitorId]/(EditMonitorSheet)/EditMonitorSheet';
import { useTranslations } from 'next-intl';

type MonitorActionMenuProps = {
  monitor: MonitorWithStatus;
  dashboardId: string;
};

export function MonitorActionMenu({ monitor, dashboardId }: MonitorActionMenuProps) {
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
            className='text-muted-foreground hover:text-foreground bg-muted/40 ring-border/50 h-8 w-8 cursor-pointer rounded-full border border-transparent ring-1 transition-colors'
          >
            <MoreHorizontal className='h-4 w-4' />
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

          <EditMonitorDialog
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className='cursor-pointer'>
              {tMisc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className='bg-destructive hover:bg-destructive/90 cursor-pointer text-white'
            >
              {deleteMutation.isPending ? tMisc('deleting') : tMisc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
