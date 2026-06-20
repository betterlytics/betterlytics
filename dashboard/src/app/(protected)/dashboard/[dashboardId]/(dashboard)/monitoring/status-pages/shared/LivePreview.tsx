'use client';

import { useDeferredValue, useMemo, type ReactNode } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { StatusPageView } from '@/app/status/[slug]/components/StatusPageView';
import {
  StatusPageAccentColorSchema,
  type PublicStatusPageData,
  type PublicStatusPageIncident,
  type StatusPagePreviewPayload,
  type StatusPageTheme,
} from '@/entities/analytics/statusPage.entities';
import { deriveOverallStatus, deriveOverallUptime } from '@/presenters/publicStatusPage';
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
  draftIncident?: PublicStatusPageIncident | null;
  /** Scale of the rendered page inside the browser frame. Defaults to 0.5 (half size). */
  zoom?: number;
  /** Extra element after the "Live preview" label in the chrome bar (e.g. a close button in a modal). */
  chromeRight?: ReactNode;
  /** Center the URL pill at its content width instead of stretching it full-width (nicer on the wide modal view). */
  centerUrl?: boolean;
  /** Extra classes on the outer frame */
  className?: string;
};

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
  draftIncident,
  zoom = 0.5,
  chromeRight,
  centerUrl = false,
  className,
}: LivePreviewProps) {
  const tEditor = useTranslations('statusPagesPage.editor');

  const draft = useDeferredValue(liveDraft);

  const data = useMemo<PublicStatusPageData>(() => {
    const indexByCheckId = new Map(payload.monitorCheckIds.map((checkId, index) => [checkId, index]));
    const includedRows = draft.monitors.filter((row) => row.included);

    const monitors = includedRows.map((row, position) => {
      const index = indexByCheckId.get(row.monitorCheckId);
      const base = index != null ? payload.data.monitors[index] : undefined;
      return {
        key: String(position),
        publicName: row.publicName.trim() || (base?.publicName ?? ''),
        status: base?.status ?? ('unknown' as const),
        uptime: base?.uptime ?? null,
        days: base?.days ?? [],
      };
    });

    const nameByMonitorIndex = new Map(
      includedRows
        .map((row) => [indexByCheckId.get(row.monitorCheckId), row.publicName.trim()] as const)
        .filter(([index]) => index != null),
    );

    const publishedIncidents = draft.showPastIncidents
      ? (payload.data.incidents ?? []).map((incident, index) => {
          const monitorIndex = payload.incidentMonitorIndexes[index];
          const draftName = monitorIndex >= 0 ? nameByMonitorIndex.get(monitorIndex) : undefined;
          return { ...incident, monitorPublicName: draftName ?? null };
        })
      : null;

    const incidents = draft.showPastIncidents
      ? [...(draftIncident ? [draftIncident] : []), ...(publishedIncidents ?? [])]
      : null;

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
      overallStatus: deriveOverallStatus(monitors.map((monitor) => monitor.status)),
      overallUptime: deriveOverallUptime(monitors.map((monitor) => monitor.uptime)),
      monitors,
      incidents,
    };
  }, [payload, draft, draftIncident]);

  const body = (
    <div className='[&_.bl-status-page]:min-h-0' style={{ zoom }}>
      <NextIntlClientProvider locale='en' messages={{ publicStatusPage: messages }}>
        <StatusPageView data={data} />
      </NextIntlClientProvider>
    </div>
  );

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
          {`${publicHost}/status/${draft.slug}`}
        </span>
        <div className={cn('flex items-center gap-1.5', centerUrl ? 'flex-1 justify-end' : 'ml-1 flex-none')}>
          <span className='text-muted-foreground flex-none text-xs'>{tEditor('preview')}</span>
          {chromeRight}
        </div>
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto'>{body}</div>
    </div>
  );
}
