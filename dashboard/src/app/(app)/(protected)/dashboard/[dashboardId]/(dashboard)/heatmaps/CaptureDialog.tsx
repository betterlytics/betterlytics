'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { SettingToggle } from '@/components/inputs/SettingToggle';
import ExternalLink from '@/components/ExternalLink';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createHeatmapCaptureLinkAction } from '@/app/actions/analytics/heatmapCaptures.actions';
import { HEATMAP_CAPTURE_LINK_TTL_MS, type HeatmapCapture } from '@/entities/analytics/heatmapCaptures.entities';
import type { HeatmapDevice } from '@/entities/analytics/clickHeatmap.entities';
import {
  captureUrl,
  captureWindowFeatures,
  initialCaptureAddress,
  resolveCaptureAddress,
  type CaptureAddressError,
} from './captureTarget';

const POLL_MS = 3000;
const DOCS_URL = 'https://betterlytics.io/docs/dashboard/heatmaps';

/**
 * The origin the dialog suggests. The panel runs it and hands it to the dialog, so the address is
 * filled in when the dialog opens, also right after a new period.
 */
export function useCaptureOrigin(pagePath: string, enabled: boolean) {
  const { input, options } = useBAQueryParams();
  return trpc.clickHeatmap.captureOrigin.useQuery({ ...input, url: pagePath }, { ...options, enabled });
}

type CaptureDialogProps = {
  onClose: () => void;
  pagePath: string;
  device: HeatmapDevice;
  /** The page's captures on every device, newest first */
  pageCaptures: HeatmapCapture[];
  originQuery: ReturnType<typeof useCaptureOrigin>;
  onCaptured: (captureId: string) => void;
};

/** Mounted while open, so every capture starts from fresh inputs */
export function CaptureDialog({
  onClose,
  pagePath,
  device,
  pageCaptures,
  originQuery,
  onCaptured,
}: CaptureDialogProps) {
  const t = useTranslations('components.heatmaps.capture');
  const tDevices = useTranslations('components.heatmaps.devices');
  const dashboardId = useDashboardId();
  const addressRef = useRef<HTMLInputElement>(null);

  // Null until edited, so the suggested address can still arrive after the dialog opens
  const [editedAddress, setEditedAddress] = useState<string | null>(null);
  const [hideText, setHideText] = useState(false);
  const [error, setError] = useState<CaptureAddressError | null>(null);
  // When the link was made: the history can be stale or hold another editor's newer capture
  const [waitingSince, setWaitingSince] = useState<number | null>(null);

  const focusAddress = (event: Event) => {
    const field = addressRef.current;
    if (!field) return;
    event.preventDefault();
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  };

  const origin = originQuery.data?.origin;
  const suggestedAddress = initialCaptureAddress(pagePath, origin, pageCaptures);
  const loadingAddress = editedAddress === null && suggestedAddress === null && originQuery.isPending;
  const address = editedAddress ?? suggestedAddress ?? (loadingAddress ? '' : pagePath);
  const target = resolveCaptureAddress(address, origin);

  // The capture arrives from the other window; the list is polled until it shows up
  const capturesQuery = trpc.heatmapCaptures.list.useQuery(
    { dashboardId, path: pagePath },
    { enabled: waitingSince !== null, refetchInterval: POLL_MS },
  );
  const arrived = useMemo(
    () =>
      waitingSince === null
        ? undefined
        : capturesQuery.data?.find(
            (capture) => capture.device === device && new Date(capture.createdAt).getTime() >= waitingSince,
          ),
    [capturesQuery.data, waitingSince, device],
  );

  useEffect(() => {
    if (!arrived) return;
    toast.success(t('captured'));
    onCaptured(arrived.id);
    onClose();
  }, [arrived, onCaptured, onClose, t]);

  useEffect(() => {
    if (waitingSince === null) return;
    const timer = setTimeout(() => setWaitingSince(null), HEATMAP_CAPTURE_LINK_TTL_MS);
    return () => clearTimeout(timer);
  }, [waitingSince]);

  // Closing ends the wait, so while a capture is under way only the buttons close the dialog
  const keepOpenWhileWaiting = (event: Event) => {
    if (waitingSince !== null) event.preventDefault();
  };

  const createLink = useMutation({
    mutationFn: () => createHeatmapCaptureLinkAction(dashboardId, { path: pagePath, device }),
  });

  // The window opens inside the click so pop-up blockers allow it; the link fills it in after
  const handleOpen = () => {
    if (loadingAddress || createLink.isPending || waitingSince !== null) return;
    if ('error' in target) {
      setError(target.error);
      addressRef.current?.focus();
      return;
    }
    setError(null);

    const opened = window.open('', `betterlytics-capture-${device}`, captureWindowFeatures(device, window.screen));
    if (!opened) {
      toast.error(t('popupBlocked'));
      return;
    }
    opened.opener = null;
    createLink.mutate(undefined, {
      onSuccess: ({ token, expiresAt }) => {
        opened.location.href = captureUrl(target.url, token, pagePath, hideText);
        setWaitingSince(new Date(expiresAt).getTime() - HEATMAP_CAPTURE_LINK_TTL_MS);
      },
      onError: (mutationError) => {
        opened.close();
        toast.error(mutationError instanceof Error ? mutationError.message : t('linkFailed'));
      },
    });
  };

  const waiting = waitingSince !== null;
  const alert = error
    ? t(`errors.${error}`)
    : originQuery.isError && address.trim().startsWith('/')
      ? t('errors.originFailed')
      : null;
  const pathWildcard = 'error' in target && target.error === 'wildcard';
  const note = alert ?? (pathWildcard ? t('wildcardHint') : null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='sm:max-w-md'
        onOpenAutoFocus={focusAddress}
        onInteractOutside={keepOpenWhileWaiting}
        onEscapeKeyDown={keepOpenWhileWaiting}
        {...(waiting ? {} : { 'aria-describedby': undefined })}
      >
        <DialogHeader>
          <DialogTitle>{t('title', { device: tDevices(device) })}</DialogTitle>
          {waiting && <DialogDescription>{t('waitingHint')}</DialogDescription>}
        </DialogHeader>

        {waiting ? (
          <div className='flex flex-col items-center gap-3 py-6 text-center'>
            <Spinner size='sm' />
            <p className='text-sm font-medium'>{t('waiting')}</p>
            <ExternalLink
              href={`${DOCS_URL}#troubleshooting`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary text-xs hover:underline'
            >
              {t('troubleshooting')}
            </ExternalLink>
          </div>
        ) : (
          <div className='space-y-6 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='capture-address'>{t('pageLabel')}</Label>
              <Input
                ref={addressRef}
                id='capture-address'
                type='url'
                value={address}
                placeholder={t('pagePlaceholder')}
                spellCheck={false}
                autoComplete='off'
                aria-invalid={alert ? true : undefined}
                aria-describedby={note ? 'capture-address-note' : undefined}
                className='font-mono text-sm'
                onChange={(event) => {
                  setEditedAddress(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleOpen();
                }}
              />
              {note && (
                <p
                  id='capture-address-note'
                  role={alert ? 'alert' : undefined}
                  className={alert ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}
                >
                  {note}
                </p>
              )}
            </div>
            <SettingToggle
              id='capture-hide-text'
              label={t('hideText')}
              checked={hideText}
              onCheckedChange={setHideText}
            />
          </div>
        )}

        <DialogFooter className='sm:items-center'>
          {!waiting && (
            <ExternalLink
              href={`${DOCS_URL}#capturing-pages`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary text-center text-sm hover:underline sm:mr-auto sm:text-left'
            >
              {t('learnMore')}
            </ExternalLink>
          )}
          <Button variant='outline' className='cursor-pointer' onClick={onClose}>
            {waiting ? t('close') : t('cancel')}
          </Button>
          {!waiting && (
            <Button className='cursor-pointer' onClick={handleOpen} disabled={loadingAddress || createLink.isPending}>
              {t('open')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
