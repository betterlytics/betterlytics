'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  resolveCaptureTarget,
  wildcardParts,
  wildcardValues,
  type CaptureTarget,
  type CaptureTargetError,
} from './captureTarget';

const POLL_MS = 3000;

type CaptureDialogProps = {
  onClose: () => void;
  pagePath: string;
  device: HeatmapDevice;
  captures: HeatmapCapture[];
  onCaptured: (captureId: string) => void;
};

/** Mounted while open, so every capture starts from fresh inputs */
export function CaptureDialog({ onClose, pagePath, device, captures, onCaptured }: CaptureDialogProps) {
  const t = useTranslations('components.heatmaps.capture');
  const tDevices = useTranslations('components.heatmaps.devices');
  const dashboardId = useDashboardId();
  const { input, options } = useBAQueryParams();
  const parts = wildcardParts(pagePath);

  const [hideText, setHideText] = useState(false);
  // The real page used last time for this page path is filled in again
  const [values, setValues] = useState<string[]>(() => {
    const lastCapturedFrom = captures.find((capture) => capture.capturedFromPath !== capture.path)?.capturedFromPath;
    return lastCapturedFrom ? wildcardValues(pagePath, lastCapturedFrom) : parts.slice(1).map(() => '');
  });
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [error, setError] = useState<CaptureTargetError | null>(null);
  const [waitingFor, setWaitingFor] = useState<Set<string> | null>(null);

  const originQuery = trpc.clickHeatmap.captureOrigin.useQuery(
    { ...input, url: pagePath },
    { ...options, placeholderData: undefined },
  );

  // The capture arrives from the other window; the list is polled until a new one shows up
  const capturesQuery = trpc.heatmapCaptures.list.useQuery(
    { dashboardId, path: pagePath, device },
    { enabled: waitingFor !== null, refetchInterval: POLL_MS },
  );
  const arrived = useMemo(
    () => (waitingFor === null ? undefined : capturesQuery.data?.find((capture) => !waitingFor.has(capture.id))),
    [capturesQuery.data, waitingFor],
  );

  useEffect(() => {
    if (!arrived) return;
    toast.success(t('captured'));
    onCaptured(arrived.id);
    onClose();
  }, [arrived, onCaptured, onClose, t]);

  useEffect(() => {
    if (waitingFor === null) return;
    const timer = setTimeout(() => setWaitingFor(null), HEATMAP_CAPTURE_LINK_TTL_MS);
    return () => clearTimeout(timer);
  }, [waitingFor]);

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
      values,
      customUrl,
    });
    if ('error' in target) {
      setError(target.error);
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
    const known = new Set(captures.map((capture) => capture.id));
    createLink.mutate(target, {
      onSuccess: ({ token }) => {
        opened.location.href = captureUrl(target, token, hideText);
        setWaitingFor(known);
      },
      onError: (mutationError) => {
        opened.close();
        toast.error(mutationError instanceof Error ? mutationError.message : t('linkFailed'));
      },
    });
  };

  const deviceName = tDevices(device);
  const size = CAPTURE_WINDOW[device];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('title', { device: deviceName })}</DialogTitle>
          <DialogDescription className='break-all'>{pagePath}</DialogDescription>
        </DialogHeader>

        {waitingFor !== null ? (
          <div className='space-y-3 text-sm'>
            <p className='flex items-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t('waiting', { device: deviceName })}
            </p>
            <p className='text-muted-foreground'>{t('noScriptHint')}</p>
          </div>
        ) : (
          <div className='space-y-4 text-sm'>
            <p>{size ? t('howWindow', { width: size.width }) : t('howTab')}</p>
            <p className='text-muted-foreground'>{t('privacy')}</p>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='capture-hide-text'
                checked={hideText}
                onCheckedChange={(checked) => setHideText(checked === true)}
              />
              <Label htmlFor='capture-hide-text'>{t('hideText')}</Label>
            </div>

            {customUrl === null && parts.length > 1 && (
              <div className='space-y-2'>
                <p className='text-muted-foreground'>{t('wildcardHelp')}</p>
                <div className='flex flex-wrap items-center gap-1 font-mono text-xs'>
                  {parts.map((part, index) => (
                    <span key={index} className='flex items-center gap-1'>
                      {index > 0 && (
                        <Input
                          aria-label={t('wildcardValue', { index })}
                          className='h-8 w-32 font-mono text-xs'
                          value={values[index - 1] ?? ''}
                          onChange={(event) =>
                            setValues((current) => {
                              const next = [...current];
                              next[index - 1] = event.target.value;
                              return next;
                            })
                          }
                        />
                      )}
                      {part && <span>{part}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {customUrl === null ? (
              <Button variant='link' className='h-auto cursor-pointer p-0' onClick={() => setCustomUrl('')}>
                {t('differentUrl')}
              </Button>
            ) : (
              <div className='space-y-1'>
                <Label htmlFor='capture-custom-url'>{t('differentUrl')}</Label>
                <Input
                  id='capture-custom-url'
                  placeholder={t('differentUrlPlaceholder')}
                  value={customUrl}
                  onChange={(event) => setCustomUrl(event.target.value)}
                />
                <p className='text-muted-foreground text-xs'>{t('differentUrlHelp', { path: pagePath })}</p>
              </div>
            )}

            <p className='text-muted-foreground text-xs'>{size ? t('keepWindowSize') : t('keepWindowWide')}</p>
            {error && (
              <p className='text-destructive text-xs' role='alert'>
                {t(`errors.${error}`, { path: pagePath, domain: originQuery.data?.domain ?? '' })}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' className='cursor-pointer' onClick={onClose}>
            {waitingFor !== null ? t('close') : t('cancel')}
          </Button>
          {waitingFor === null && (
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
