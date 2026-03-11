import { useState, useMemo } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { upsertErrorGroupAction, bulkUpsertErrorGroupAction } from '@/app/actions/analytics/errors.actions';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';

export type StatusFilter = 'all' | ErrorGroupStatusValue;

export function useErrorGroupActions(errorGroups: ErrorGroupRow[], dashboardId: string) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ErrorGroupStatusValue>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unresolved');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const getStatus = (fingerprint: string, base: ErrorGroupStatusValue): ErrorGroupStatusValue =>
    statusOverrides[fingerprint] ?? base;

  const statusCounts = useMemo(() => {
    const counts = { all: errorGroups.length, unresolved: 0, resolved: 0, ignored: 0 };
    for (const g of errorGroups) counts[getStatus(g.error_fingerprint, g.status)]++;
    return counts;
  }, [errorGroups, statusOverrides]);

  const filteredByStatus = useMemo(
    () => statusFilter === 'all' ? errorGroups : errorGroups.filter((g) => getStatus(g.error_fingerprint, g.status) === statusFilter),
    [errorGroups, statusFilter, statusOverrides],
  );

  async function setStatus(fingerprint: string, status: ErrorGroupStatusValue) {
    setStatusOverrides((prev) => ({ ...prev, [fingerprint]: status }));
    setRowSelection((prev) => { const next = { ...prev }; delete next[fingerprint]; return next; });
    await upsertErrorGroupAction(dashboardId, fingerprint, status);
  }

  async function bulkSetStatus(fingerprints: string[], status: ErrorGroupStatusValue) {
    setStatusOverrides((prev) => {
      const next = { ...prev };
      for (const fp of fingerprints) next[fp] = status;
      return next;
    });
    await bulkUpsertErrorGroupAction(dashboardId, fingerprints, status);
    setRowSelection({});
  }

  function changeStatusFilter(next: StatusFilter) {
    setStatusFilter(next);
    setRowSelection({});
  }

  const selectedFingerprints = Object.keys(rowSelection);

  return {
    statusFilter,
    statusCounts,
    filteredByStatus,
    getStatus,
    setStatus,
    bulkSetStatus,
    changeStatusFilter,
    rowSelection,
    setRowSelection,
    selectedFingerprints,
    selectedCount: selectedFingerprints.length,
  };
}
