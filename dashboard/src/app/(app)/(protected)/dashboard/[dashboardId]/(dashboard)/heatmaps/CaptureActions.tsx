'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Camera, ChevronDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { deleteHeatmapCaptureAction } from '@/app/actions/analytics/heatmapCaptures.actions';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';

type CaptureActionsProps = {
  captures: HeatmapCapture[];
  shownCaptureId: string | undefined;
  onSelect: (captureId: string) => void;
  onCapture: () => void;
};

export function useCaptureLabel() {
  const t = useTranslations('components.heatmaps.capture');
  const locale = useLocale();
  return (capture: HeatmapCapture) => {
    const date = new Date(capture.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    const name = capture.createdByName ?? t('formerMember');
    return capture.capturedFromPath !== capture.path
      ? t('capturedByFrom', { date, name, path: capture.capturedFromPath })
      : t('capturedBy', { date, name });
  };
}

/** Capture history for the page and device, plus capturing and deleting for editors and above */
export function CaptureActions({ captures, shownCaptureId, onSelect, onCapture }: CaptureActionsProps) {
  const t = useTranslations('components.heatmaps.capture');
  const dashboardId = useDashboardId();
  const { hasPermission } = useDashboardAuth();
  const canCapture = hasPermission('canCaptureHeatmaps');
  const utils = trpc.useUtils();
  const label = useCaptureLabel();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteCapture = useMutation({
    mutationFn: (captureId: string) => deleteHeatmapCaptureAction(dashboardId, captureId),
    onSuccess: () => {
      toast.success(t('deleted'));
      void utils.heatmapCaptures.list.invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('deleteFailed')),
  });

  return (
    <div className='flex shrink-0 items-center gap-2'>
      {captures.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='cursor-pointer'>
              {t('history', { count: captures.length })}
              <ChevronDown className='ml-1 h-3.5 w-3.5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='max-w-sm'>
            <DropdownMenuLabel>{t('historyTitle')}</DropdownMenuLabel>
            {captures.map((capture) => (
              <DropdownMenuItem
                key={capture.id}
                className='cursor-pointer'
                onSelect={() => onSelect(capture.id)}
                aria-current={capture.id === shownCaptureId}
              >
                <span className={capture.id === shownCaptureId ? 'font-medium' : undefined}>{label(capture)}</span>
              </DropdownMenuItem>
            ))}
            {canCapture && shownCaptureId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive cursor-pointer'
                  onSelect={() => setConfirmDelete(true)}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  {t('deleteShown')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canCapture && (
        <Button size='sm' className='cursor-pointer' onClick={onCapture}>
          <Camera className='mr-1 h-4 w-4' />
          {t('captureButton')}
        </Button>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className='cursor-pointer'
              onClick={() => shownCaptureId && deleteCapture.mutate(shownCaptureId)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
