'use client';

import { useMemo, useState } from 'react';
import type { McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';

// Below this many dashboards the whole list fits, so there is no search
const SEARCH_FROM_DASHBOARDS = 8;

type Selection = { allDashboards: boolean; picked: Set<string> };

function initialSelection(dashboards: { id: string }[], previous: McpGrantSelection | null): Selection {
  if (!previous || previous.allDashboards) {
    return { allDashboards: true, picked: new Set(dashboards.map((dashboard) => dashboard.id)) };
  }
  return { allDashboards: false, picked: new Set(previous.dashboardIds) };
}

/**
 * The dashboards an agent may read, as picked on the consent page and when editing a connection: All dashboards,
 * or the picked ones, of which there must be at least one.
 */
export function useDashboardGrantPicker<Dashboard extends { id: string; domain: string }>(
  dashboards: Dashboard[],
  previous: McpGrantSelection | null,
) {
  const [{ allDashboards, picked }, setSelection] = useState<Selection>(() =>
    initialSelection(dashboards, previous),
  );
  const [query, setQuery] = useState('');

  const total = dashboards.length;
  const searchable = total >= SEARCH_FROM_DASHBOARDS;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return searchable && needle ? dashboards.filter((d) => d.domain.toLowerCase().includes(needle)) : dashboards;
  }, [query, dashboards, searchable]);
  const visiblePicked = visible.filter((d) => picked.has(d.id)).length;

  const setPicked = (next: Set<string>) => setSelection((current) => ({ ...current, picked: next }));
  const setAllDashboards = (on: boolean) => setSelection((current) => ({ ...current, allDashboards: on }));

  const togglePicked = (dashboardId: string, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(dashboardId);
    else next.delete(dashboardId);
    setPicked(next);
  };

  // acts on the rows the search shows, so "search shop, select all" picks only those
  const toggleVisible = (on: boolean) => {
    const next = new Set(picked);
    for (const dashboard of visible) {
      if (on) next.add(dashboard.id);
      else next.delete(dashboard.id);
    }
    setPicked(next);
  };

  const selectAllState: boolean | 'indeterminate' =
    allDashboards || (visiblePicked > 0 && visiblePicked === visible.length)
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
    canSave: allDashboards || picked.size > 0,
    selection: { allDashboards, dashboardIds: allDashboards ? [] : [...picked] } satisfies McpGrantSelection,
  };
}
