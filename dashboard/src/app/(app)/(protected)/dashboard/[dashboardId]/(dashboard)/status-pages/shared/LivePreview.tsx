'use client';

import { memo, useDeferredValue, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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
  statusDotFavicon,
  type OpenIncidentRef,
} from '@/entities/analytics/statusPage/publicStatusPage.helpers';
import { cn } from '@/lib/utils';

export type PreviewDraft = {
  name: string;
  slug: string;
  customDomain: string | null;
  theme: StatusPageTheme;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
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
  /** Mount the enlarged-modal machinery (required for any enlarge trigger, external or hover). */
  enlargeable?: boolean;
  /** Show the hover "Enlarge" pill. The studio canvas turns it off: its zoom control makes the modal redundant on desktop, while the mobile header button still opens it. */
  hoverEnlarge?: boolean;
  enlargedOpen?: boolean;
  onEnlargedOpenChange?: (open: boolean) => void;
  zoom?: number;
  frameStyle?: CSSProperties;
  className?: string;
};

const PreviewFrame = memo(function PreviewFrame({
  data,
  messages,
  publicHost,
  slug,
  customDomain,
  faviconUrl,
  label,
  zoom,
  chromeRight,
  className,
  style,
}: {
  data: PublicStatusPageData;
  messages: Record<string, unknown>;
  publicHost: string;
  slug: string;
  customDomain: string | null;
  faviconUrl?: string | null;
  label: string;
  zoom: number;
  chromeRight?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn('bg-card border-border flex flex-col overflow-hidden rounded-xl border', className)}
      style={style}
    >
      <div className='border-border flex flex-none items-center gap-1.5 border-b px-3 py-2'>
        <div className='flex flex-1 items-center gap-1.5'>
          <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
          <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
          <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        </div>
        <span className='bg-muted text-muted-foreground flex max-w-[60%] min-w-0 items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs'>
          {/* eslint-disable-next-line @next/next/no-img-element -- owner-provided image (or staged blob / data URI), not optimizable via next/image */}
          <img
            src={faviconUrl ?? statusDotFavicon(data.overallStatus)}
            alt=''
            className='h-3.5 w-3.5 flex-none rounded-[3px] object-contain'
          />

          <span className='truncate'>{customDomain ? customDomain : `${publicHost}/status/${slug}`}</span>
        </span>
        <div className='flex flex-1 items-center justify-end gap-1.5'>
          <span className='text-muted-foreground flex-none text-xs'>{label}</span>
          {chromeRight}
        </div>
      </div>
      {/* Anchors go inert: preview content must never navigate the editor away (the page has
          real links, e.g. the powered-by footer). Buttons stay live so expanders still work. */}
      <div className='min-h-0 flex-1 overflow-y-auto [&_a]:pointer-events-none'>
        <div className='[&_.bl-status-page]:min-h-0' style={{ zoom }}>
          <NextIntlClientProvider locale='en' messages={{ publicStatusPage: messages }}>
            <StatusPageView data={data} />
          </NextIntlClientProvider>
        </div>
      </div>
    </div>
  );
});

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
  hoverEnlarge = true,
  enlargedOpen,
  onEnlargedOpenChange,
  zoom = 0.5,
  frameStyle,
  className,
}: LivePreviewProps) {
  const tEditor = useTranslations('statusPagesPage.editor');

  const draft = useDeferredValue(liveDraft);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = enlargedOpen ?? internalOpen;
  const setOpen = onEnlargedOpenChange ?? setInternalOpen;

  const indexByCheckId = useMemo(
    () => new Map(payload.monitorCheckIds.map((checkId, index) => [checkId, index])),
    [payload.monitorCheckIds],
  );

  // The expensive monitor/incident derivation only depends on the monitor selection,
  // so cosmetic edits (name, colors, theme) skip it and just re-run the overlay below.
  const draftMonitors = draft.monitors;
  const derived = useMemo(() => {
    const includedRows = draftMonitors.filter((row) => row.included);

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

    return {
      monitors,
      overallStatus,
      overallUptime: deriveOverallUptime(monitors.map((monitor) => monitor.uptime)),
      publishedIncidents,
    };
  }, [payload, indexByCheckId, draftMonitors]);

  const data = useMemo<PublicStatusPageData>(() => {
    const visibleIncidents = draft.showPastIncidents
      ? derived.publishedIncidents
      : derived.publishedIncidents.filter((incident) => incident.resolvedAt == null);
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
      overallStatus: derived.overallStatus,
      overallUptime: derived.overallUptime,
      monitors: derived.monitors,
      incidents,
    };
  }, [payload, draft, derived]);

  const frame = (
    <PreviewFrame
      data={data}
      messages={messages}
      publicHost={publicHost}
      slug={draft.slug}
      customDomain={draft.customDomain}
      faviconUrl={draft.faviconUrl}
      label={tEditor('preview')}
      zoom={zoom}
      style={frameStyle}
      className={className}
    />
  );

  if (!enlargeable) return frame;

  return (
    <>
      {/* The enlarge affordance is a small floating pill, NOT a full-frame cover: a cover
          swallows wheel events and makes the preview unscrollable. */}
      <div className='group relative mx-auto flex max-h-full min-h-0'>
        {frame}
        {hoverEnlarge && (
          <button
            type='button'
            onClick={() => setOpen(true)}
            aria-label={tEditor('wizard.enlargePreview')}
            className='absolute top-10 right-3 flex cursor-pointer items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none'
          >
            <Maximize2 className='h-3.5 w-3.5' />
            {tEditor('wizard.enlargePreview')}
          </button>
        )}
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
              customDomain={draft.customDomain}
              faviconUrl={draft.faviconUrl}
              label={tEditor('preview')}
              zoom={0.85}
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
