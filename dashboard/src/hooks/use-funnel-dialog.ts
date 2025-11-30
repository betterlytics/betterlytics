import { useDebounce } from '@/hooks/useDebounce';
import { useCallback, useMemo, useState } from 'react';
import { useFunnelSteps } from '@/hooks/use-funnel-steps';
import { useQuery } from '@tanstack/react-query';
import { fetchFunnelPreviewAction } from '@/app/actions';
import type { FunnelStep } from '@/entities/funnels';

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
  const { funnelSteps, addEmptyFunnelStep, updateFunnelStep, removeFunnelStep, setFunnelSteps } =
    useFunnelSteps(initialSteps);
  const [metadata, setMetadata] = useState<FunnelMetadata>({
    name: initialName,
    isStrict: initialIsStrict,
  });
  const debouncedFunnelSteps = useDebounce(funnelSteps, 500);

  const searchableFunnelSteps = useMemo(() => {
    const findFilterableIndex = debouncedFunnelSteps.findIndex(
      (step) => false === (Boolean(step.column) && Boolean(step.operator) && Boolean(step.value)),
    );

    const steps =
      findFilterableIndex === -1 ? debouncedFunnelSteps : debouncedFunnelSteps.slice(0, findFilterableIndex);

    return steps.map((step) => ({
      ...step,
      name: '',
    }));
  }, [debouncedFunnelSteps]);

  const { data: funnelPreviewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['funnelPreview', dashboardId, searchableFunnelSteps, false],
    queryFn: async () => {
      return fetchFunnelPreviewAction(dashboardId, searchableFunnelSteps, false);
    },
    enabled: searchableFunnelSteps.length >= 2,
  });

  const funnelPreview = useMemo(() => {
    if (!funnelPreviewData) return null;
    return {
      ...funnelPreviewData,
      steps: funnelPreviewData.steps.map((step) => ({
        ...step,
        step: {
          ...step.step,
          name: debouncedFunnelSteps.find((s) => s.id === step.step.id)?.name || ' - ',
        },
      })),
    };
  }, [funnelPreviewData, debouncedFunnelSteps]);

  const emptySteps = useMemo(() => {
    const findFilterableIndex = debouncedFunnelSteps.findIndex(
      (step) => false === (Boolean(step.column) && Boolean(step.operator) && Boolean(step.value)),
    );

    const steps = findFilterableIndex === -1 ? [] : debouncedFunnelSteps.slice(findFilterableIndex);

    return steps.map((step) => ({
      ...step,
      name: debouncedFunnelSteps.find((s) => s.id === step.id)?.name || ' - ',
    }));
  }, [debouncedFunnelSteps]);

  const setName = useCallback((name: string) => {
    setMetadata((prev) => ({ ...prev, name }));
  }, []);

  const setIsStrict = useCallback((isStrict: boolean) => {
    setMetadata((prev) => ({ ...prev, isStrict }));
  }, []);

  const reset = useCallback(() => {
    setMetadata({
      name: initialName,
      isStrict: initialIsStrict,
    });
    setFunnelSteps(initialSteps ?? []);
  }, [initialIsStrict, initialName, initialSteps, setFunnelSteps]);

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
    isPreviewLoading,
    reset,
    setFunnelSteps,
  };
}
