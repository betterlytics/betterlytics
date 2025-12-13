'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { type Annotation, type ChartAnnotation, type ChartId } from '@/entities/dashboard/annotation.entities';
import {
  getAnnotationsAction,
  createAnnotationAction,
  updateAnnotationAction,
  deleteAnnotationAction,
} from '@/app/actions/index.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';

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
    updates: Pick<ChartAnnotation, 'label' | 'description' | 'colorToken' | 'date'>,
  ) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function toChartAnnotation(annotation: Annotation): ChartAnnotation {
  const parsedDate = annotation.date instanceof Date ? annotation.date : new Date(annotation.date);

  return {
    id: annotation.id,
    date: parsedDate.getTime(),
    label: annotation.label,
    description: annotation.description ?? undefined,
    colorToken: annotation.colorToken ?? undefined,
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
    } catch {
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
        colorToken: chartAnnotation.colorToken ?? null,
        createdById: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
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
            colorToken: chartAnnotation.colorToken ?? null,
          });

          // Replace optimistic annotation with the real one
          setAnnotations((prev) => prev.map((a) => (a.id === optimisticId ? created : a)));
        } catch (error) {
          // Remove optimistic annotation on failure
          setAnnotations((prev) => prev.filter((a) => a.id !== optimisticId));
        }
      });
    },
    [dashboardId, chartId],
  );

  const updateAnnotation = useCallback(
    async (id: string, updates: Pick<ChartAnnotation, 'label' | 'description' | 'colorToken' | 'date'>) => {
      if (!dashboardId) return;

      const previousAnnotations = annotations;

      // Optimistically update the annotation
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                label: updates.label,
                description: updates.description ?? null,
                colorToken: updates.colorToken ?? null,
                date: updates.date ? new Date(updates.date) : a.date,
              }
            : a,
        ),
      );

      try {
        await updateAnnotationAction(dashboardId, id, {
          label: updates.label,
          description: updates.description ?? undefined,
          colorToken: updates.colorToken ?? undefined,
          date: updates.date ? new Date(updates.date) : undefined,
        });
      } catch (error) {
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
