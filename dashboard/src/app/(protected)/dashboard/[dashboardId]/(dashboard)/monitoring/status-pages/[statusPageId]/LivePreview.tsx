'use client';

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { fetchPublicStatusPageMessagesAction } from '@/app/actions/analytics/statusPage.actions';
import { StatusPageView } from '@/app/status/[slug]/components/StatusPageView';
import type { SupportedLanguages } from '@/constants/i18n';
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
  language: SupportedLanguages;
  logoUrl: string | null;
  showPastIncidents: boolean;
  monitors: Array<{ monitorCheckId: string; included: boolean; publicName: string }>;
};

type LivePreviewProps = {
  dashboardId: string;
  payload: StatusPagePreviewPayload;
  initialLanguage: SupportedLanguages;
  initialMessages: Record<string, unknown>;
  publicHost: string;
  draft: PreviewDraft;
  draftIncident?: PublicStatusPageIncident | null;
  /** Scale of the rendered page inside the browser frame. Defaults to 0.5 (half size). */
  zoom?: number;
  /** Extra element after the "Live preview" label in the chrome bar (e.g. a close button in a modal). */
  chromeRight?: ReactNode;
  /** Extra classes on the outer frame */
  className?: string;
};

/**
 * Client-composed live preview: the server assembles uptime/incident data for
 * ALL dashboard monitors once (payload), and every form edit is layered on top
 * here. Message bundles are fetched per page language so
 * the preview always reads in the OWNER's chosen language.
 */
export function LivePreview({
  dashboardId,
  payload,
  initialLanguage,
  initialMessages,
  publicHost,
  draft: liveDraft,
  draftIncident,
  zoom = 0.5,
  chromeRight,
  className,
}: LivePreviewProps) {
  const tEditor = useTranslations('statusPagesPage.editor');

  const draft = useDeferredValue(liveDraft);
  const [messagesByLanguage, setMessagesByLanguage] = useState<
    Partial<Record<SupportedLanguages, Record<string, unknown>>>
  >({ [initialLanguage]: initialMessages });

  useEffect(() => {
    if (messagesByLanguage[draft.language]) return;
    let cancelled = false;
    fetchPublicStatusPageMessagesAction(dashboardId, draft.language).then((messages) => {
      if (!cancelled) {
        setMessagesByLanguage((current) => ({ ...current, [draft.language]: messages }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [draft.language, dashboardId, messagesByLanguage]);

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
      language: draft.language,
      logoUrl: draft.logoUrl,
      accentColor: StatusPageAccentColorSchema.safeParse(draft.accentColor).success
        ? draft.accentColor
        : payload.data.accentColor,
      overallStatus: deriveOverallStatus(monitors.map((monitor) => monitor.status)),
      overallUptime: deriveOverallUptime(monitors.map((monitor) => monitor.uptime)),
      monitors,
      incidents,
    };
  }, [payload, draft, draftIncident]);

  const messages = messagesByLanguage[draft.language] ?? initialMessages;

  const body = (
    <div className='[&_.bl-status-page]:min-h-0' style={{ zoom }}>
      <NextIntlClientProvider locale={draft.language} messages={{ publicStatusPage: messages }}>
        <StatusPageView data={data} />
      </NextIntlClientProvider>
    </div>
  );

  return (
    <div className={cn('bg-card border-border flex flex-col overflow-hidden rounded-xl border', className)}>
      <div className='border-border flex flex-none items-center gap-1.5 border-b px-3 py-2'>
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted text-muted-foreground ml-2 min-w-0 flex-1 truncate rounded-md px-2.5 py-0.5 text-xs'>
          {`${publicHost}/status/${draft.slug}`}
        </span>
        <span className='text-muted-foreground ml-1 flex-none text-xs'>{tEditor('preview')}</span>
        {chromeRight}
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto'>{body}</div>
    </div>
  );
}
