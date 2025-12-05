'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { type Annotation } from '@/entities/annotation';
import { type ChartAnnotation } from '@/components/InteractiveChart';
import {
  getAnnotationsAction,
  createAnnotationAction,
  updateAnnotationAction,
  deleteAnnotationAction,
} from '@/app/actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';

export const CHART_IDS = {
  OVERVIEW: 'overview',
  WEB_VITALS: 'web-vitals',
  PAGE_TRAFFIC: 'page-traffic',
} as const;

export type ChartId = (typeof CHART_IDS)[keyof typeof CHART_IDS];

interface UseChartAnnotationsOptions {
  chartId: ChartId;
  enabled?: boolean;
}

interface UseChartAnnotationsReturn {
  annotations: ChartAnnotation[];
  isLoading: boolean;
  isCreating: boolean;
  createAnnotation: (annotation: Omit<ChartAnnotation, 'id'>) => Promise<void>;
  updateAnnotation: (
    id: string,
    updates: Pick<ChartAnnotation, 'label' | 'description' | 'color'>,
  ) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Converts a database Annotation to the ChartAnnotation format used by the chart component
 */
function toChartAnnotation(annotation: Annotation): ChartAnnotation {
  return {
    id: annotation.id,
    date: annotation.date.getTime(),
    label: annotation.label,
    description: annotation.description ?? undefined,
    color: annotation.color ?? undefined,
  };
}

export function useChartAnnotations({
  chartId,
  enabled = true,
}: UseChartAnnotationsOptions): UseChartAnnotationsReturn {
  const dashboardId = useDashboardId();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, startCreateTransition] = useTransition();

  const fetchAnnotations = useCallback(async () => {
    if (!dashboardId || !enabled) return;

    try {
      setIsLoading(true);
      const result = await getAnnotationsAction(dashboardId, chartId);
      setAnnotations(result);
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, chartId, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchAnnotations();
    }
  }, [fetchAnnotations, enabled]);

  const createAnnotation = useCallback(
    async (chartAnnotation: Omit<ChartAnnotation, 'id'>) => {
      if (!dashboardId) return;

      // Create optimistic annotation for immediate feedback
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticAnnotation: Annotation = {
        id: optimisticId,
        dashboardId,
        chartId,
        date: new Date(chartAnnotation.date),
        label: chartAnnotation.label,
        description: chartAnnotation.description ?? null,
        color: chartAnnotation.color ?? null,
        createdById: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically add the annotation
      setAnnotations((prev) => [...prev, optimisticAnnotation]);

      startCreateTransition(async () => {
        try {
          const created = await createAnnotationAction(dashboardId, {
            chartId,
            date: new Date(chartAnnotation.date),
            label: chartAnnotation.label,
            description: chartAnnotation.description ?? null,
            color: chartAnnotation.color ?? null,
          });

          // Replace optimistic annotation with the real one
          setAnnotations((prev) => prev.map((a) => (a.id === optimisticId ? created : a)));
        } catch (error) {
          console.error('Failed to create annotation:', error);
          // Remove optimistic annotation on failure
          setAnnotations((prev) => prev.filter((a) => a.id !== optimisticId));
        }
      });
    },
    [dashboardId, chartId],
  );

  const updateAnnotation = useCallback(
    async (id: string, updates: Pick<ChartAnnotation, 'label' | 'description' | 'color'>) => {
      if (!dashboardId) return;

      // Store previous state for rollback
      const previousAnnotations = annotations;

      // Optimistically update the annotation
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                label: updates.label,
                description: updates.description ?? null,
                color: updates.color ?? null,
              }
            : a,
        ),
      );

      try {
        await updateAnnotationAction(dashboardId, id, {
          label: updates.label,
          description: updates.description ?? undefined,
          color: updates.color ?? undefined,
        });
      } catch (error) {
        console.error('Failed to update annotation:', error);
        // Restore on failure
        setAnnotations(previousAnnotations);
      }
    },
    [dashboardId, annotations],
  );

  const deleteAnnotation = useCallback(
    async (id: string) => {
      if (!dashboardId) return;

      // Optimistically remove the annotation
      const previousAnnotations = annotations;
      setAnnotations((prev) => prev.filter((a) => a.id !== id));

      try {
        await deleteAnnotationAction(dashboardId, id);
      } catch (error) {
        console.error('Failed to delete annotation:', error);
        // Restore on failure
        setAnnotations(previousAnnotations);
      }
    },
    [dashboardId, annotations],
  );

  // Convert to chart format
  const chartAnnotations = useMemo(() => annotations.map(toChartAnnotation), [annotations]);

  return {
    annotations: chartAnnotations,
    isLoading,
    isCreating,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refresh: fetchAnnotations,
  };
}
