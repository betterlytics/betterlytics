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
  CAPTURE_WINDOW,
  captureUrl,
  initialCaptureAddress,
  resolveCaptureTarget,
  type CaptureTarget,
  type CaptureTargetError,
} from './captureTarget';

const POLL_MS = 3000;
const DOCS_URL = 'https://betterlytics.io/docs/dashboard/heatmaps';

type CaptureDialogProps = {
  onClose: () => void;
  pagePath: string;
  device: HeatmapDevice;
  /** The page's captures on every device, newest first */
  pageCaptures: HeatmapCapture[];
  onCaptured: (captureId: string) => void;
};

/** Mounted while open, so every capture starts from fresh inputs */
export function CaptureDialog({ onClose, pagePath, device, pageCaptures, onCaptured }: CaptureDialogProps) {
  const t = useTranslations('components.heatmaps.capture');
  const tDevices = useTranslations('components.heatmaps.devices');
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const addressRef = useRef<HTMLInputElement>(null);

  const [address, setAddress] = useState(() => initialCaptureAddress(pagePath, pageCaptures));
  const [hideText, setHideText] = useState(false);
  const [error, setError] = useState<CaptureTargetError | null>(null);
  // When the link was made: the history can be stale or hold another editor's newer capture
  const [waitingSince, setWaitingSince] = useState<number | null>(null);

  // A wildcard left in the page is selected, so typing replaces it
  const focusAddress = (event: Event) => {
    const field = addressRef.current;
    if (!field) return;
    event.preventDefault();
    field.focus();
    const wildcard = field.value.indexOf('*');
    if (wildcard === -1) field.setSelectionRange(field.value.length, field.value.length);
    else field.setSelectionRange(wildcard, wildcard + 1);
  };

  const originQuery = trpc.clickHeatmap.captureOrigin.useQuery(
    { ...input, url: pagePath },
    { ...options, placeholderData: undefined },
  );

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
    mutationFn: (target: CaptureTarget) =>
      createHeatmapCaptureLinkAction(dashboardId, { path: pagePath, device, capturePath: target.capturePath }),
  });

  // The window opens inside the click so pop-up blockers allow it; the link fills it in after
  const handleOpen = () => {
    const origin = originQuery.data;
    if (!origin) return;
    const target = resolveCaptureTarget({
      pagePath,
      defaultOrigin: origin.origin,
      dashboardDomain: origin.domain,
      address,
    });
    if ('error' in target) {
      setError(target.error);
      addressRef.current?.focus();
      return;
    }
    setError(null);

    const size = CAPTURE_WINDOW[device];
    const opened = size
      ? window.open('', `betterlytics-capture-${device}`, `popup,width=${size.width},height=${size.height}`)
      : window.open('', '_blank');
    if (!opened) {
      toast.error(t('popupBlocked'));
      return;
    }
    opened.opener = null;
    createLink.mutate(target, {
      onSuccess: ({ token, expiresAt }) => {
        opened.location.href = captureUrl(target, token, hideText);
        setWaitingSince(new Date(expiresAt).getTime() - HEATMAP_CAPTURE_LINK_TTL_MS);
      },
      onError: (mutationError) => {
        opened.close();
        toast.error(mutationError instanceof Error ? mutationError.message : t('linkFailed'));
      },
    });
  };

  const deviceName = tDevices(device);
  const size = CAPTURE_WINDOW[device];
  const waiting = waitingSince !== null;
  const alert = originQuery.isError
    ? t('errors.originFailed')
    : error && t(`errors.${error}`, { path: pagePath, domain: originQuery.data?.domain ?? '' });
  const note = alert || (address.includes('*') ? t('pageWildcardHint') : null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='sm:max-w-md'
        onOpenAutoFocus={focusAddress}
        onInteractOutside={keepOpenWhileWaiting}
        onEscapeKeyDown={keepOpenWhileWaiting}
      >
        <DialogHeader>
          <DialogTitle>{t('title', { device: deviceName })}</DialogTitle>
          <DialogDescription>
            {size ? t('howWindow', { width: size.width }) : t('howTab')}{' '}
            <ExternalLink
              href={`${DOCS_URL}#capturing-pages`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary whitespace-nowrap hover:underline'
            >
              {t('learnMore')}
            </ExternalLink>
          </DialogDescription>
        </DialogHeader>

        {waiting ? (
          <div className='flex flex-col items-center gap-3 py-6 text-center'>
            <Spinner size='sm' />
            <div className='space-y-1'>
              <p className='text-sm font-medium'>{t('waiting')}</p>
              <p className='text-muted-foreground text-xs'>{t('waitingHint')}</p>
            </div>
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
          <div className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='capture-address'>{t('pageLabel')}</Label>
              <Input
                ref={addressRef}
                id='capture-address'
                value={address}
                placeholder={t('pagePlaceholder')}
                spellCheck={false}
                aria-invalid={alert ? true : undefined}
                aria-describedby={note ? 'capture-address-note' : undefined}
                className='font-mono text-sm'
                onChange={(event) => {
                  setAddress(event.target.value);
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
              description={t('hideTextHint')}
              checked={hideText}
              onCheckedChange={setHideText}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' className='cursor-pointer' onClick={onClose}>
            {waiting ? t('close') : t('cancel')}
          </Button>
          {!waiting && (
            <Button
              className='cursor-pointer'
              onClick={handleOpen}
              disabled={!originQuery.data || createLink.isPending}
            >
              {t('open')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
