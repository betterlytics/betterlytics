'use client';

import { useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Camera, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DestructiveActionDialog } from '@/components/dialogs';
import { cn } from '@/lib/utils';
import { deleteHeatmapCaptureAction } from '@/app/actions/analytics/heatmapCaptures.actions';
import type { HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';

export function useCaptureDetails() {
  const t = useTranslations('components.heatmaps.capture');
  const locale = useLocale();
  return (capture: HeatmapCapture) => ({
    date: new Date(capture.createdAt).toLocaleDateString(locale, { dateStyle: 'medium' }),
    // The history lists captures by time, so several from one day can be told apart
    dateTime: new Date(capture.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    name: capture.createdByName || t('formerMember'),
  });
}

type CaptureButtonProps = {
  onClick: () => void;
  label?: string;
};

/** Shown to editors and above */
export function CaptureButton({ onClick, label }: CaptureButtonProps) {
  const t = useTranslations('components.heatmaps.capture');
  const { hasPermission } = useDashboardAuth();
  if (!hasPermission('canCaptureHeatmaps')) return null;

  return (
    <Button size='sm' variant='ghost' className='h-7 cursor-pointer gap-1.5 px-2 text-xs' onClick={onClick}>
      <Camera className='size-3.5' />
      {label ?? t('captureButton')}
    </Button>
  );
}

type CaptureHistoryMenuProps = {
  captures: HeatmapCapture[];
  shownCaptureId: string | undefined;
  onSelect: (captureId: string) => void;
  trigger: ReactNode;
};

/** The page and device's captures to pick from, each deletable by editors and above */
export function CaptureHistoryMenu({ captures, shownCaptureId, onSelect, trigger }: CaptureHistoryMenuProps) {
  const t = useTranslations('components.heatmaps.capture');
  const dashboardId = useDashboardId();
  const { hasPermission } = useDashboardAuth();
  const utils = trpc.useUtils();
  const details = useCaptureDetails();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canDelete = hasPermission('canCaptureHeatmaps');

  const deleteCapture = useMutation({
    mutationFn: (captureId: string) => deleteHeatmapCaptureAction(dashboardId, captureId),
    onSuccess: () => {
      toast.success(t('deleted'));
      setDeletingId(null);
      void utils.heatmapCaptures.list.invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('deleteFailed')),
  });

  // The menu closes first, so the confirmation can take focus
  const confirmDelete = (captureId: string) => {
    setOpen(false);
    setDeletingId(captureId);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-72'>
          {captures.map((capture) => {
            const { dateTime, name } = details(capture);
            const shown = capture.id === shownCaptureId;
            return (
              <DropdownMenuItem
                key={capture.id}
                className='group cursor-pointer items-start'
                onSelect={() => onSelect(capture.id)}
                onKeyDown={(event) => {
                  if (canDelete && event.key === 'Delete') {
                    event.preventDefault();
                    confirmDelete(capture.id);
                  }
                }}
                aria-current={shown}
              >
                <Check className={cn('text-foreground mt-0.5', shown ? 'opacity-100' : 'opacity-0')} />
                <div className='min-w-0 flex-1'>
                  <p className='truncate'>{dateTime}</p>
                  <p className='text-muted-foreground truncate text-xs' title={capture.capturedFromUrl}>
                    {t('byFrom', { name, path: capture.capturedFromUrl.replace(/^https?:\/\//, '') })}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type='button'
                    aria-label={t('deleteCapture')}
                    className='text-muted-foreground hover:text-destructive -mr-1 shrink-0 cursor-pointer self-center rounded-sm p-1 opacity-0 transition-opacity group-hover:opacity-100 group-data-[highlighted]:opacity-100'
                    onClick={(event) => {
                      event.stopPropagation();
                      confirmDelete(capture.id);
                    }}
                  >
                    <Trash2 className='size-3.5 text-current' />
                  </button>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <DestructiveActionDialog
        open={deletingId !== null}
        onOpenChange={(next) => !next && setDeletingId(null)}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        onConfirm={() => deletingId && deleteCapture.mutate(deletingId)}
        isPending={deleteCapture.isPending}
      />
    </>
  );
}
