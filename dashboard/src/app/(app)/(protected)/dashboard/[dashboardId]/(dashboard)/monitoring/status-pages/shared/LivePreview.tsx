'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { Maximize2, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { StatusPageView } from '@/app/status/[slug]/components/StatusPageView';
import {
  StatusPageAccentColorSchema,
  type StatusPageTheme,
} from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type PublicStatusPageData,
  type StatusPagePreviewPayload,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import {
  deriveOverallUptime,
  deriveStatusWithIncidents,
  type OpenIncidentRef,
} from '@/entities/analytics/statusPage/publicStatusPage.helpers';
import { cn } from '@/lib/utils';

export type PreviewDraft = {
  name: string;
  slug: string;
  theme: StatusPageTheme;
  accentColor: string;
  logoUrl: string | null;
  showPastIncidents: boolean;
  hideBranding: boolean;
  monitors: Array<{ monitorCheckId: string; included: boolean; publicName: string }>;
};

type LivePreviewProps = {
  payload: StatusPagePreviewPayload;
  /** Public-status-page UI strings (English) for the rendered preview. */
  messages: Record<string, unknown>;
  publicHost: string;
  draft: PreviewDraft;
  /** Show a hover affordance that opens the preview enlarged in a modal. */
  enlargeable?: boolean;
  /** Optionally control the enlarged modal from outside (e.g. a separate trigger button) */
  enlargedOpen?: boolean;
  onEnlargedOpenChange?: (open: boolean) => void;
  /** Extra classes on the outer frame */
  className?: string;
};

/** The browser-chrome framed render of the status page at a given zoom. */
function PreviewFrame({
  data,
  messages,
  publicHost,
  slug,
  label,
  zoom,
  chromeRight,
  centerUrl = false,
  className,
}: {
  data: PublicStatusPageData;
  messages: Record<string, unknown>;
  publicHost: string;
  slug: string;
  label: string;
  /** Scale of the rendered page inside the browser frame. */
  zoom: number;
  /** Extra element after the "Live preview" label in the chrome bar (e.g. a close button). */
  chromeRight?: ReactNode;
  /** Center the URL pill at its content width instead of stretching it full-width. */
  centerUrl?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('bg-card border-border flex flex-col overflow-hidden rounded-xl border', className)}>
      <div className='border-border flex flex-none items-center gap-1.5 border-b px-3 py-2'>
        <div className={cn('flex items-center gap-1.5', centerUrl ? 'flex-1' : 'flex-none')}>
          <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
          <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
          <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        </div>
        <span
          className={cn(
            'bg-muted text-muted-foreground min-w-0 truncate rounded-md px-2.5 py-0.5 text-xs',
            centerUrl ? 'max-w-[60%]' : 'ml-2 flex-1',
          )}
        >
          {`${publicHost}/status/${slug}`}
        </span>
        <div className={cn('flex items-center gap-1.5', centerUrl ? 'flex-1 justify-end' : 'ml-1 flex-none')}>
          <span className='text-muted-foreground flex-none text-xs'>{label}</span>
          {chromeRight}
        </div>
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='[&_.bl-status-page]:min-h-0' style={{ zoom }}>
          <NextIntlClientProvider locale='en' messages={{ publicStatusPage: messages }}>
            <StatusPageView data={data} />
          </NextIntlClientProvider>
        </div>
      </div>
    </div>
  );
}

/**
 * Client-composed live preview: the server assembles uptime/incident data for
 * ALL dashboard monitors once (payload), and every form edit is layered on top
 * here. Status pages always render in English.
 */
export function LivePreview({
  payload,
  messages,
  publicHost,
  draft: liveDraft,
  enlargeable = false,
  enlargedOpen,
  onEnlargedOpenChange,
  className,
}: LivePreviewProps) {
  const tEditor = useTranslations('statusPagesPage.editor');

  const draft = useDeferredValue(liveDraft);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = enlargedOpen ?? internalOpen;
  const setOpen = onEnlargedOpenChange ?? setInternalOpen;

  const data = useMemo<PublicStatusPageData>(() => {
    const indexByCheckId = new Map(payload.monitorCheckIds.map((checkId, index) => [checkId, index]));
    const includedRows = draft.monitors.filter((row) => row.included);

    const bases = includedRows.map((row) => {
      const index = indexByCheckId.get(row.monitorCheckId);
      return index != null ? payload.data.monitors[index] : undefined;
    });
    const detectedStatuses = includedRows.map((row) => {
      const index = indexByCheckId.get(row.monitorCheckId);
      return index != null ? payload.detectedStatuses[index] : ('unknown' as const);
    });
    const publicNames = includedRows.map(
      (row, position) => row.publicName.trim() || (bases[position]?.publicName ?? ''),
    );

    const openIncidents: OpenIncidentRef[] = (payload.data.incidents ?? []).flatMap(
      (incident, index): OpenIncidentRef[] => {
        if (incident.resolvedAt != null) return [];
        const checkIds = payload.incidentMonitorCheckIds[index] ?? [];
        return checkIds.length === 0
          ? [{ impact: incident.impact, monitorKey: null }]
          : checkIds.map((checkId) => ({ impact: incident.impact, monitorKey: checkId }));
      },
    );

    const { monitorStatuses, overallStatus } = deriveStatusWithIncidents(
      includedRows.map((row, position) => ({ key: row.monitorCheckId, detected: detectedStatuses[position] })),
      openIncidents,
    );

    const monitors = includedRows.map((row, position) => ({
      key: String(position),
      publicName: publicNames[position],
      status: monitorStatuses[position],
      uptime: bases[position]?.uptime ?? null,
      days: bases[position]?.days ?? [],
    }));

    const nameByCheckId = new Map(
      includedRows.map((row, position) => [row.monitorCheckId, publicNames[position]]),
    );
    const publishedIncidents = (payload.data.incidents ?? []).map((incident, index) => {
      // Re-resolve affected monitors to their live (draft) names; drop any no longer included.
      const monitorPublicNames = (payload.incidentMonitorCheckIds[index] ?? [])
        .map((checkId) => nameByCheckId.get(checkId))
        .filter((name): name is string => name != null && name.length > 0);
      return { ...incident, monitorPublicNames };
    });

    const visibleIncidents = draft.showPastIncidents
      ? publishedIncidents
      : publishedIncidents.filter((incident) => incident.resolvedAt == null);
    const incidents = draft.showPastIncidents || visibleIncidents.length > 0 ? visibleIncidents : null;

    return {
      ...payload.data,
      name: draft.name.trim() || payload.data.name,
      slug: draft.slug,
      theme: draft.theme,
      logoUrl: draft.logoUrl,
      // The preview renders inline, so don't make the logo a real link that would navigate the
      // editor away when clicked. The homepage link has no visual effect to preview anyway.
      homepageUrl: null,
      accentColor: StatusPageAccentColorSchema.safeParse(draft.accentColor).success
        ? draft.accentColor
        : payload.data.accentColor,
      hideBranding: draft.hideBranding,
      showPastIncidents: draft.showPastIncidents,
      overallStatus,
      overallUptime: deriveOverallUptime(monitors.map((monitor) => monitor.uptime)),
      monitors,
      incidents,
    };
  }, [payload, draft]);

  const frame = (
    <PreviewFrame
      data={data}
      messages={messages}
      publicHost={publicHost}
      slug={draft.slug}
      label={tEditor('preview')}
      zoom={0.5}
      className={className}
    />
  );

  if (!enlargeable) return frame;

  return (
    <>
      <div className='group relative'>
        {frame}
        <button
          type='button'
          onClick={() => setOpen(true)}
          aria-label={tEditor('wizard.enlargePreview')}
          className='absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl opacity-0 transition-opacity hover:bg-black/30 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none'
        >
          <span className='flex items-center gap-1.5 rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-sm'>
            <Maximize2 className='h-3.5 w-3.5' />
            {tEditor('wizard.enlargePreview')}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-[min(96vw,1080px)] -translate-x-1/2 -translate-y-1/2 duration-200'
          >
            <DialogTitle className='sr-only'>{tEditor('preview')}</DialogTitle>
            <PreviewFrame
              data={data}
              messages={messages}
              publicHost={publicHost}
              slug={draft.slug}
              label={tEditor('preview')}
              zoom={0.85}
              centerUrl
              className='max-h-[88vh]'
              chromeRight={
                <DialogClose
                  aria-label={tEditor('wizard.close')}
                  className='text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded transition-colors'
                >
                  <X className='h-4 w-4' />
                </DialogClose>
              }
            />
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
