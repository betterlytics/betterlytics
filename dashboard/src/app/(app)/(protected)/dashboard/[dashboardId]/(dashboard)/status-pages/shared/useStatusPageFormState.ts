'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  type StatusPageTheme,
  type StatusPageVisibility,
} from '@/entities/analytics/statusPage/statusPage.entities';
import {
  defaultPublicMonitorName,
  isValidCustomDomain,
  isValidHomepageUrl,
} from '@/entities/analytics/statusPage/statusPage.helpers';
import { type PreviewDraft } from './LivePreview';
import { type MonitorRow } from './monitorRow';
import { useStagedImage } from './useStagedImage';

export type StatusPageFormInitial = {
  name: string;
  slug: string;
  theme: StatusPageTheme;
  accentColor: string;
  showPastIncidents: boolean;
  hideBranding?: boolean;
  visibility: StatusPageVisibility;
  homepageUrl?: string | null;
  customDomain?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  monitorRows: MonitorRow[];
};

export type StatusPageFormValues = {
  name: string;
  slug: string;
  theme: StatusPageTheme;
  accentColor: string;
  showPastIncidents: boolean;
  hideBranding: boolean;
  visibility: StatusPageVisibility;
  homepageUrl: string;
  customDomain: string;
  monitorRows: MonitorRow[];
};

function normalizeValues(initial: StatusPageFormInitial): StatusPageFormValues {
  return {
    name: initial.name,
    slug: initial.slug,
    theme: initial.theme,
    accentColor: initial.accentColor,
    showPastIncidents: initial.showPastIncidents,
    hideBranding: initial.hideBranding ?? false,
    visibility: initial.visibility,
    homepageUrl: initial.homepageUrl ?? '',
    customDomain: initial.customDomain ?? '',
    monitorRows: initial.monitorRows,
  };
}

export function useStatusPageFormState(initial: StatusPageFormInitial) {
  const [values, setValues] = useState<StatusPageFormValues>(() => normalizeValues(initial));
  const logo = useStagedImage(initial.logoUrl ?? null);
  const favicon = useStagedImage(initial.faviconUrl ?? null);

  const patch = useCallback(
    (partial: Partial<StatusPageFormValues>) => setValues((current) => ({ ...current, ...partial })),
    [],
  );

  const setMonitorRows = useCallback(
    (next: MonitorRow[] | ((rows: MonitorRow[]) => MonitorRow[])) =>
      setValues((current) => ({
        ...current,
        monitorRows: typeof next === 'function' ? next(current.monitorRows) : next,
      })),
    [],
  );

  const updateRow = useCallback(
    (index: number, rowPatch: Partial<MonitorRow>) =>
      setValues((current) => ({
        ...current,
        monitorRows: current.monitorRows.map((row, i) => (i === index ? { ...row, ...rowPatch } : row)),
      })),
    [],
  );

  const reset = useCallback(
    (next: StatusPageFormValues) => {
      setValues(next);
      logo.reset();
      favicon.reset();
    },
    [logo, favicon],
  );

  const includedCount = useMemo(
    () => values.monitorRows.filter((row) => row.included).length,
    [values.monitorRows],
  );

  const monitorsPayload = useMemo(
    () =>
      values.monitorRows
        .filter((row) => row.included)
        .map((row) => ({
          monitorCheckId: row.monitorCheckId,
          publicName: row.publicName.trim() || defaultPublicMonitorName(row),
        })),
    [values.monitorRows],
  );

  const isNameEmpty = values.name.trim().length === 0;
  const isHomepageUrlValid = isValidHomepageUrl(values.homepageUrl);
  const isCustomDomainValid = isValidCustomDomain(values.customDomain);

  const settingsInput = useMemo(
    () => ({
      slug: values.slug,
      visibility: values.visibility,
      customDomain: values.customDomain.trim() || null,
    }),
    [values.slug, values.visibility, values.customDomain],
  );

  const studioInput = useMemo(
    () => ({
      name: values.name.trim(),
      theme: values.theme,
      accentColor: values.accentColor,
      showPastIncidents: values.showPastIncidents,
      hideBranding: values.hideBranding,
      homepageUrl: values.homepageUrl.trim() || null,
      monitors: monitorsPayload,
    }),
    [values, monitorsPayload],
  );

  const input = useMemo(() => ({ ...settingsInput, ...studioInput }), [settingsInput, studioInput]);

  // Stable identity across cosmetic edits so LivePreview's derivation memo only
  // recomputes when the monitor selection itself changes.
  const previewMonitors = useMemo(
    () =>
      values.monitorRows.map((row) => ({
        monitorCheckId: row.monitorCheckId,
        included: row.included,
        publicName: row.publicName,
      })),
    [values.monitorRows],
  );

  const previewDraft: PreviewDraft = useMemo(
    () => ({
      name: values.name,
      slug: values.slug,
      customDomain: values.customDomain.trim() || null,
      theme: values.theme,
      accentColor: values.accentColor,
      logoUrl: logo.url,
      faviconUrl: favicon.url,
      showPastIncidents: values.showPastIncidents,
      hideBranding: values.hideBranding,
      monitors: previewMonitors,
    }),
    [values, logo.url, favicon.url, previewMonitors],
  );

  return {
    ...values,
    patch,
    setMonitorRows,
    updateRow,
    reset,
    logo,
    favicon,
    hasStagedImages: logo.dirty || favicon.dirty,
    includedCount,
    isNameEmpty,
    isHomepageUrlValid,
    isCustomDomainValid,
    monitorsPayload,
    settingsInput,
    studioInput,
    input,
    /** The current values object; stable per render, so dirty checks can JSON-compare it. */
    snapshot: values,
    previewDraft,
  };
}

export type StatusPageFormState = ReturnType<typeof useStatusPageFormState>;
