import { useDebounce } from '@/hooks/useDebounce';
import { useCallback, useMemo, useState } from 'react';
import { useFunnelSteps } from '@/hooks/use-funnel-steps';
import { trpc } from '@/trpc/client';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useQueryState } from '@/hooks/use-query-state';
import type { FunnelStep } from '@/entities/analytics/funnels.entities';
import type { PresentedFunnel } from '@/presenters/toFunnel';

export type FunnelMetadata = {
  name: string;
  isStrict: boolean;
};

type UseFunnelDialogOptions = {
  dashboardId: string;
  initialName: string;
  initialIsStrict?: boolean;
  initialSteps?: FunnelStep[];
};

export function useFunnelDialog({
  dashboardId,
  initialName,
  initialIsStrict = false,
  initialSteps,
}: UseFunnelDialogOptions) {
  const {
    funnelSteps,
    addEmptyFunnelStep,
    updateFunnelStep,
    removeFunnelStep,
    setFunnelSteps,
  } = useFunnelSteps(initialSteps);
  const [metadata, setMetadata] = useState<FunnelMetadata>({
    name: initialName,
    isStrict: initialIsStrict,
  });
  const debouncedFunnelSteps = useDebounce(funnelSteps, 500);
  const analyticsQuery = useAnalyticsQuery();

  const isStepSearchable = (step: FunnelStep) =>
    step.filters.length > 0 &&
    step.filters.every((f) => Boolean(f.column) && Boolean(f.operator) && f.values.length > 0);

  const searchableFunnelSteps = useMemo(() => {
    const findFilterableIndex = debouncedFunnelSteps.findIndex((step) => !isStepSearchable(step));

    const steps =
      findFilterableIndex === -1 ? debouncedFunnelSteps : debouncedFunnelSteps.slice(0, findFilterableIndex);

    return steps.map((step) => ({
      ...step,
      name: '',
    }));
  }, [debouncedFunnelSteps]);

  const previewQuery = trpc.funnels.preview.useQuery(
    { dashboardId, query: analyticsQuery, funnelSteps: searchableFunnelSteps, isStrict: metadata.isStrict },
    { enabled: searchableFunnelSteps.length >= 2 },
  );
  const { data: funnelPreviewData, loading: previewLoading, refetching: previewRefetching } =
    useQueryState(previewQuery, searchableFunnelSteps.length >= 2);

  const funnelPreview = useMemo(() => {
    if (!funnelPreviewData) return null;
    const data = funnelPreviewData as PresentedFunnel;
    return {
      ...data,
      steps: data.steps.map((step) => ({
        ...step,
        step: {
          ...step.step,
          name: debouncedFunnelSteps.find((s) => s.id === step.step.id)?.name || ' - ',
        },
      })),
    };
  }, [funnelPreviewData, debouncedFunnelSteps]);

  const emptySteps = useMemo(() => {
    const findFilterableIndex = debouncedFunnelSteps.findIndex((step) => !isStepSearchable(step));

    const steps = findFilterableIndex === -1 ? [] : debouncedFunnelSteps.slice(findFilterableIndex);

    return steps.map((step) => ({
      ...step,
      name: debouncedFunnelSteps.find((s) => s.id === step.id)?.name || ' - ',
    }));
  }, [debouncedFunnelSteps]);

  const previewStatus: 'empty' | 'loading' | 'data' = useMemo(() => {
    if (searchableFunnelSteps.length < 2) return 'empty';
    if (previewLoading || !funnelPreview) return 'loading';
    return 'data';
  }, [searchableFunnelSteps.length, previewLoading, funnelPreview]);

  const setName = useCallback((name: string) => {
    setMetadata((prev) => ({ ...prev, name }));
  }, []);

  const setIsStrict = useCallback((isStrict: boolean) => {
    setMetadata((prev) => ({ ...prev, isStrict }));
  }, []);

  const reset = useCallback(
    (resetTo: { name: string; isStrict: boolean; steps: FunnelStep[] }) => {
      setMetadata({
        name: resetTo.name,
        isStrict: resetTo.isStrict,
      });
      setFunnelSteps(resetTo.steps);
    },
    [setFunnelSteps],
  );

  return {
    metadata,
    setMetadata,
    setName,
    setIsStrict,
    funnelSteps,
    addEmptyFunnelStep,
    updateFunnelStep,
    removeFunnelStep,
    searchableFunnelSteps,
    funnelPreview,
    emptySteps,
    previewStatus,
    previewRefetching,
    reset,
    setFunnelSteps,
  };
}
