'use client';

import { useMemo, useState } from 'react';
import type { McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';

// Below this many dashboards the whole list fits, so there is no search
const SEARCH_FROM_DASHBOARDS = 8;

type Selection = { allDashboards: boolean; picked: Set<string> };
type PickableDashboard = { id: string; domain: string; aiAccessEnabled: boolean };

// a previous grant lists what it covers, so switching from All dashboards to selected starts from those
function initialSelection(dashboards: PickableDashboard[], previous: McpGrantSelection | null): Selection {
  if (!previous) {
    const available = dashboards.filter((dashboard) => dashboard.aiAccessEnabled);
    return { allDashboards: true, picked: new Set(available.map((dashboard) => dashboard.id)) };
  }
  return { allDashboards: previous.allDashboards, picked: new Set(previous.dashboardIds) };
}

/**
 * The dashboards an agent may read, as picked on the consent page and when editing a connection: All dashboards,
 * or the picked ones, of which there must be at least one. A dashboard with AI access off can't be newly picked;
 * one the grant already has stays picked, so turning AI access back on restores it.
 */
export function useDashboardGrantPicker<Dashboard extends PickableDashboard>(
  dashboards: Dashboard[],
  previous: McpGrantSelection | null,
) {
  const [initial] = useState<Selection>(() => initialSelection(dashboards, previous));
  const [{ allDashboards, picked }, setSelection] = useState<Selection>(initial);
  const [query, setQuery] = useState('');

  const unavailable = useMemo(
    () =>
      new Set(
        dashboards
          .filter((dashboard) => !dashboard.aiAccessEnabled && !initial.picked.has(dashboard.id))
          .map((dashboard) => dashboard.id),
      ),
    [dashboards, initial],
  );
  const isUnavailable = (dashboardId: string) => unavailable.has(dashboardId);

  const total = dashboards.length;
  const searchable = total >= SEARCH_FROM_DASHBOARDS;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return searchable && needle ? dashboards.filter((d) => d.domain.toLowerCase().includes(needle)) : dashboards;
  }, [query, dashboards, searchable]);
  const visiblePicked = visible.filter((d) => picked.has(d.id)).length;
  const visiblePickable = visible.filter((d) => !unavailable.has(d.id)).length;

  const setPicked = (next: Set<string>) => setSelection((current) => ({ ...current, picked: next }));
  const setAllDashboards = (on: boolean) => setSelection((current) => ({ ...current, allDashboards: on }));

  const togglePicked = (dashboardId: string, on: boolean) => {
    if (on && unavailable.has(dashboardId)) return;
    const next = new Set(picked);
    if (on) next.add(dashboardId);
    else next.delete(dashboardId);
    setPicked(next);
  };

  // acts on the rows the search shows, so "search shop, select all" picks only those
  const toggleVisible = (on: boolean) => {
    const next = new Set(picked);
    for (const dashboard of visible) {
      if (on && !unavailable.has(dashboard.id)) next.add(dashboard.id);
      else if (!on) next.delete(dashboard.id);
    }
    setPicked(next);
  };

  const selectAllState: boolean | 'indeterminate' =
    allDashboards || (visiblePicked > 0 && visiblePicked >= visiblePickable)
      ? true
      : visiblePicked === 0
        ? false
        : 'indeterminate';

  return {
    allDashboards,
    setAllDashboards,
    picked,
    togglePicked,
    toggleVisible,
    selectAllState,
    query,
    setQuery,
    total,
    searchable,
    visible,
    visiblePicked,
    // select all picks what it can, and clears when that is all picked
    selectAllPicks: visiblePicked < visiblePickable,
    isUnavailable,
    canSave: allDashboards || picked.size > 0,
    selection: { allDashboards, dashboardIds: allDashboards ? [] : [...picked] } satisfies McpGrantSelection,
  };
}
