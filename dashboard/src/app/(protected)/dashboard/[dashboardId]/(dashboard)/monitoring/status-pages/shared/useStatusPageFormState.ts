'use client';

import { useCallback, useMemo, useState } from 'react';
import { defaultPublicMonitorName, type StatusPageTheme } from '@/entities/analytics/statusPage.entities';
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

  const reset = useCallback((values: Omit<StatusPageFormInitial, 'logoUrl'>) => {
    setName(values.name);
    setSlug(values.slug);
    setTheme(values.theme);
    setAccentColor(values.accentColor);
    setShowPastIncidents(values.showPastIncidents);
    setMonitorRows(values.monitorRows);
  }, []);

  const includedCount = useMemo(() => monitorRows.filter((row) => row.included).length, [monitorRows]);

  const monitorsPayload = useMemo(
    () =>
      monitorRows
        .filter((row) => row.included)
        .map((row) => ({
          monitorCheckId: row.monitorCheckId,
          publicName: row.publicName.trim() || defaultPublicMonitorName(row),
        })),
    [monitorRows],
  );

  const isNameEmpty = name.trim().length === 0;

  // Server-shaped input for create/update actions: trimmed name, only the included monitors.
  const input = useMemo(
    () => ({ name: name.trim(), slug, theme, accentColor, showPastIncidents, monitors: monitorsPayload }),
    [name, slug, theme, accentColor, showPastIncidents, monitorsPayload],
  );

  // The editable form state, as a plain snapshot. Used to capture/restore a save point when
  // discarding edits.
  const snapshot: Omit<StatusPageFormInitial, 'logoUrl'> = useMemo(
    () => ({ name, slug, theme, accentColor, showPastIncidents, monitorRows }),
    [name, slug, theme, accentColor, showPastIncidents, monitorRows],
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
    reset,
    includedCount,
    isNameEmpty,
    monitorsPayload,
    input,
    snapshot,
    previewDraft,
  };
}

export type StatusPageFormState = ReturnType<typeof useStatusPageFormState>;
