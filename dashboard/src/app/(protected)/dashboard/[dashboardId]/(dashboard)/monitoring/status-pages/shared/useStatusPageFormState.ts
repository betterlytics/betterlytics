'use client';

import { useCallback, useMemo, useState } from 'react';
import { type StatusPageTheme } from '@/entities/analytics/statusPage.entities';
import { type PreviewDraft } from './LivePreview';
import { type MonitorRow } from './SortableMonitorRow';

export type StatusPageFormInitial = {
  name: string;
  slug: string;
  theme: StatusPageTheme;
  accentColor: string;
  showPastIncidents: boolean;
  logoUrl?: string | null;
  monitorRows: MonitorRow[];
};

export function useStatusPageFormState(initial: StatusPageFormInitial) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [theme, setTheme] = useState<StatusPageTheme>(initial.theme);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [showPastIncidents, setShowPastIncidents] = useState(initial.showPastIncidents);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl ?? null);
  const [monitorRows, setMonitorRows] = useState<MonitorRow[]>(initial.monitorRows);

  const updateRow = useCallback(
    (index: number, patch: Partial<MonitorRow>) =>
      setMonitorRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row))),
    [],
  );

  const includedCount = useMemo(() => monitorRows.filter((row) => row.included).length, [monitorRows]);

  const monitorsPayload = useMemo(
    () =>
      monitorRows
        .filter((row) => row.included)
        .map((row) => ({ monitorCheckId: row.monitorCheckId, publicName: row.publicName.trim() })),
    [monitorRows],
  );

  const previewDraft: PreviewDraft = useMemo(
    () => ({
      name,
      slug,
      theme,
      accentColor,
      logoUrl,
      showPastIncidents,
      monitors: monitorRows.map((row) => ({
        monitorCheckId: row.monitorCheckId,
        included: row.included,
        publicName: row.publicName,
      })),
    }),
    [name, slug, theme, accentColor, logoUrl, showPastIncidents, monitorRows],
  );

  return {
    name,
    setName,
    slug,
    setSlug,
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    showPastIncidents,
    setShowPastIncidents,
    logoUrl,
    setLogoUrl,
    monitorRows,
    setMonitorRows,
    updateRow,
    includedCount,
    monitorsPayload,
    previewDraft,
  };
}

export type StatusPageFormState = ReturnType<typeof useStatusPageFormState>;
