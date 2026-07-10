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
import { type MonitorOperationalState } from '@/entities/analytics/monitoring.entities';
import { type PreviewDraft } from './LivePreview';
import { useStagedImage } from './useStagedImage';

export type MonitorRow = {
  monitorCheckId: string;
  name: string | null;
  url: string;
  included: boolean;
  publicName: string;
  operationalState?: MonitorOperationalState;
  uptimePercent?: number | null;
};

export function newMonitorRow(monitor: { id: string; name?: string | null; url: string }): MonitorRow {
  return {
    monitorCheckId: monitor.id,
    name: monitor.name ?? null,
    url: monitor.url,
    included: true,
    publicName: defaultPublicMonitorName(monitor),
    operationalState: 'preparing',
    uptimePercent: null,
  };
}

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

type StatusPageFormSnapshot = Omit<StatusPageFormInitial, 'logoUrl' | 'faviconUrl'>;

export function useStatusPageFormState(initial: StatusPageFormInitial) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [theme, setTheme] = useState<StatusPageTheme>(initial.theme);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [showPastIncidents, setShowPastIncidents] = useState(initial.showPastIncidents);
  const [hideBranding, setHideBranding] = useState(initial.hideBranding ?? false);
  const [visibility, setVisibility] = useState<StatusPageVisibility>(initial.visibility);
  const [homepageUrl, setHomepageUrl] = useState(initial.homepageUrl ?? '');
  const [customDomain, setCustomDomain] = useState(initial.customDomain ?? '');
  const logo = useStagedImage(initial.logoUrl ?? null);
  const favicon = useStagedImage(initial.faviconUrl ?? null);
  const [monitorRows, setMonitorRows] = useState<MonitorRow[]>(initial.monitorRows);

  const updateRow = useCallback(
    (index: number, patch: Partial<MonitorRow>) =>
      setMonitorRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row))),
    [],
  );

  const reset = useCallback(
    (values: StatusPageFormSnapshot) => {
      setName(values.name);
      setSlug(values.slug);
      setTheme(values.theme);
      setAccentColor(values.accentColor);
      setShowPastIncidents(values.showPastIncidents);
      setHideBranding(values.hideBranding ?? false);
      setVisibility(values.visibility);
      setHomepageUrl(values.homepageUrl ?? '');
      setCustomDomain(values.customDomain ?? '');
      setMonitorRows(values.monitorRows);
      logo.reset();
      favicon.reset();
    },
    [logo, favicon],
  );

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
  const isHomepageUrlValid = isValidHomepageUrl(homepageUrl);
  const isCustomDomainValid = isValidCustomDomain(customDomain);

  const input = useMemo(
    () => ({
      name: name.trim(),
      slug,
      theme,
      accentColor,
      showPastIncidents,
      hideBranding,
      visibility,
      homepageUrl: homepageUrl.trim() || null,
      customDomain: customDomain.trim() || null,
      monitors: monitorsPayload,
    }),
    [
      name,
      slug,
      theme,
      accentColor,
      showPastIncidents,
      hideBranding,
      visibility,
      homepageUrl,
      customDomain,
      monitorsPayload,
    ],
  );

  const snapshot: StatusPageFormSnapshot = useMemo(
    () => ({
      name,
      slug,
      theme,
      accentColor,
      showPastIncidents,
      hideBranding,
      visibility,
      homepageUrl,
      customDomain,
      monitorRows,
    }),
    [
      name,
      slug,
      theme,
      accentColor,
      showPastIncidents,
      hideBranding,
      visibility,
      homepageUrl,
      customDomain,
      monitorRows,
    ],
  );

  // Stable identity across cosmetic edits so LivePreview's derivation memo only
  // recomputes when the monitor selection itself changes.
  const previewMonitors = useMemo(
    () =>
      monitorRows.map((row) => ({
        monitorCheckId: row.monitorCheckId,
        included: row.included,
        publicName: row.publicName,
      })),
    [monitorRows],
  );

  const previewDraft: PreviewDraft = useMemo(
    () => ({
      name,
      slug,
      customDomain: customDomain.trim() || null,
      theme,
      accentColor,
      logoUrl: logo.url,
      faviconUrl: favicon.url,
      showPastIncidents,
      hideBranding,
      monitors: previewMonitors,
    }),
    [
      name,
      slug,
      customDomain,
      theme,
      accentColor,
      logo.url,
      favicon.url,
      showPastIncidents,
      hideBranding,
      previewMonitors,
    ],
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
    hideBranding,
    setHideBranding,
    visibility,
    setVisibility,
    homepageUrl,
    setHomepageUrl,
    customDomain,
    setCustomDomain,
    logoUrl: logo.url,
    stageLogo: logo.stage,
    removeLogo: logo.remove,
    logoChange: logo.change,
    commitLogo: logo.commit,
    faviconUrl: favicon.url,
    stageFavicon: favicon.stage,
    removeFavicon: favicon.remove,
    faviconChange: favicon.change,
    commitFavicon: favicon.commit,
    hasStagedImages: logo.dirty || favicon.dirty,
    monitorRows,
    setMonitorRows,
    updateRow,
    reset,
    includedCount,
    isNameEmpty,
    isHomepageUrlValid,
    isCustomDomainValid,
    monitorsPayload,
    input,
    snapshot,
    previewDraft,
  };
}

export type StatusPageFormState = ReturnType<typeof useStatusPageFormState>;
