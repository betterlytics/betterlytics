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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
    date: new Date(capture.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    name: capture.createdByName || t('formerMember'),
  });
}

type CaptureButtonProps = {
  onClick: () => void;
  label?: string;
  emphasis?: boolean;
};

/** Shown to editors and above */
export function CaptureButton({ onClick, label, emphasis = false }: CaptureButtonProps) {
  const t = useTranslations('components.heatmaps.capture');
  const { hasPermission } = useDashboardAuth();
  if (!hasPermission('canCaptureHeatmaps')) return null;

  return (
    <Button
      size='sm'
      variant={emphasis ? 'default' : 'outline'}
      className='h-7 cursor-pointer gap-1.5 px-2.5 text-xs'
      onClick={onClick}
    >
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

/** The page and device's captures to pick from, and deleting the shown one for editors and above */
export function CaptureHistoryMenu({ captures, shownCaptureId, onSelect, trigger }: CaptureHistoryMenuProps) {
  const t = useTranslations('components.heatmaps.capture');
  const dashboardId = useDashboardId();
  const { hasPermission } = useDashboardAuth();
  const utils = trpc.useUtils();
  const details = useCaptureDetails();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteCapture = useMutation({
    mutationFn: (captureId: string) => deleteHeatmapCaptureAction(dashboardId, captureId),
    onSuccess: () => {
      toast.success(t('deleted'));
      setConfirmDelete(false);
      void utils.heatmapCaptures.list.invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('deleteFailed')),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-72'>
          <DropdownMenuLabel className='text-muted-foreground text-xs'>{t('historyTitle')}</DropdownMenuLabel>
          {captures.map((capture) => {
            const { date, name } = details(capture);
            const shown = capture.id === shownCaptureId;
            return (
              <DropdownMenuItem
                key={capture.id}
                className='cursor-pointer items-start'
                onSelect={() => onSelect(capture.id)}
                aria-current={shown}
              >
                <Check className={cn('text-foreground mt-0.5', shown ? 'opacity-100' : 'opacity-0')} />
                <div className='min-w-0'>
                  <p className='truncate'>{date}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {capture.capturedFromPath !== capture.path
                      ? t('byFrom', { name, path: capture.capturedFromPath })
                      : name}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
          {hasPermission('canCaptureHeatmaps') && shownCaptureId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                className='cursor-pointer'
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 />
                {t('deleteShown')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DestructiveActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        onConfirm={() => shownCaptureId && deleteCapture.mutate(shownCaptureId)}
        isPending={deleteCapture.isPending}
      />
    </>
  );
}
