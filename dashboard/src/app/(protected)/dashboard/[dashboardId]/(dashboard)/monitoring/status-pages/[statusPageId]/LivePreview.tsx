'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { fetchPublicStatusPageMessagesAction } from '@/app/actions/analytics/statusPage.actions';
import { StatusPageView } from '@/app/status/[slug]/components/StatusPageView';
import type { SupportedLanguages } from '@/constants/i18n';
import {
  StatusPageAccentColorSchema,
  type PublicStatusPageData,
  type StatusPagePreviewPayload,
  type StatusPageTheme,
} from '@/entities/analytics/statusPage.entities';
import { deriveOverallStatus, deriveOverallUptime } from '@/presenters/publicStatusPage';

export type PreviewDraft = {
  name: string;
  slug: string;
  theme: StatusPageTheme;
  accentColor: string;
  language: SupportedLanguages;
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
}: LivePreviewProps) {
  const tEditor = useTranslations('statusPagesPage.editor');
  
  const draft = useDeferredValue(liveDraft);
  const [messagesByLanguage, setMessagesByLanguage] = useState<Partial<Record<SupportedLanguages, Record<string, unknown>>>>(
    { [initialLanguage]: initialMessages },
  );

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

    const incidents = draft.showPastIncidents
      ? (payload.data.incidents ?? []).map((incident, index) => {
          const monitorIndex = payload.incidentMonitorIndexes[index];
          const draftName = monitorIndex >= 0 ? nameByMonitorIndex.get(monitorIndex) : undefined;
          return { ...incident, monitorPublicName: draftName ?? null };
        })
      : null;

    return {
      ...payload.data,
      name: draft.name.trim() || payload.data.name,
      slug: draft.slug,
      theme: draft.theme,
      language: draft.language,
      accentColor: StatusPageAccentColorSchema.safeParse(draft.accentColor).success
        ? draft.accentColor
        : payload.data.accentColor,
      overallStatus: deriveOverallStatus(monitors.map((monitor) => monitor.status)),
      overallUptime: deriveOverallUptime(monitors.map((monitor) => monitor.uptime)),
      monitors,
      incidents,
    };
  }, [payload, draft]);

  const messages = messagesByLanguage[draft.language] ?? initialMessages;

  return (
    <div className='bg-card border-border overflow-hidden rounded-xl border'>
      <div className='border-border flex items-center gap-1.5 border-b px-3 py-2'>
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted text-muted-foreground ml-2 min-w-0 flex-1 truncate rounded-md px-2.5 py-0.5 text-xs'>
          {`${publicHost}/status/${draft.slug}`}
        </span>
        <span className='text-muted-foreground ml-1 flex-none text-xs'>{tEditor('preview')}</span>
      </div>
      {/* zoom (not transform) so the scaled preview also lays out at half size */}
      <div style={{ zoom: 0.5 }}>
        <NextIntlClientProvider locale={draft.language} messages={{ publicStatusPage: messages }}>
          <StatusPageView data={data} />
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
