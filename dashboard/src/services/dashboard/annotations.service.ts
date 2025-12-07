'server-only';

import {
  type Annotation,
  type AnnotationCreate,
  type AnnotationUpdate,
} from '@/entities/dashboard/annotation.entities';
import {
  createAnnotation,
  getAnnotationsByDashboardAndChart,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
} from '@/repositories/postgres/annotations.repository';

export async function createDashboardAnnotation(data: AnnotationCreate): Promise<Annotation> {
  return createAnnotation(data);
}

export async function getDashboardAnnotations(dashboardId: string, chartId: string): Promise<Annotation[]> {
  return getAnnotationsByDashboardAndChart(dashboardId, chartId);
}

export async function getDashboardAnnotation(dashboardId: string, id: string): Promise<Annotation | null> {
  return getAnnotationById(dashboardId, id);
}

export async function updateDashboardAnnotation(id: string, data: AnnotationUpdate): Promise<Annotation> {
  return updateAnnotation(id, data);
}

export async function deleteDashboardAnnotation(id: string): Promise<void> {
  return deleteAnnotation(id);
}
