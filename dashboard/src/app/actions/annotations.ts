'use server';

import { withDashboardMutationAuthContext, withDashboardAuthContext } from '@/auth/auth-actions';
import {
  type Annotation,
  type AnnotationCreate,
  AnnotationCreateSchema,
  AnnotationUpdateSchema,
} from '@/entities/annotation';
import {
  createDashboardAnnotation,
  getDashboardAnnotations,
  getDashboardAnnotation,
  updateDashboardAnnotation,
  deleteDashboardAnnotation,
} from '@/services/annotations';
import { type AuthContext } from '@/entities/authContext';

export const createAnnotationAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, payload: Omit<AnnotationCreate, 'dashboardId' | 'createdById'>) => {
    const data = AnnotationCreateSchema.parse({
      ...payload,
      dashboardId: ctx.dashboardId,
      createdById: ctx.userId,
    });

    return await createDashboardAnnotation(data);
  },
);

export const getAnnotationsAction = withDashboardAuthContext(
  async (ctx: AuthContext, chartId: string): Promise<Annotation[]> => {
    return await getDashboardAnnotations(ctx.dashboardId, chartId);
  },
);

export const updateAnnotationAction = withDashboardMutationAuthContext(
  async (
    ctx: AuthContext,
    annotationId: string,
    payload: Partial<Pick<Annotation, 'label' | 'description' | 'colorToken' | 'date'>>,
  ) => {
    const annotation = await getDashboardAnnotation(ctx.dashboardId, annotationId);
    if (!annotation) {
      throw new Error('Annotation not found or access denied');
    }

    const data = AnnotationUpdateSchema.parse(payload);
    return await updateDashboardAnnotation(annotationId, data);
  },
);

export const deleteAnnotationAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, annotationId: string) => {
    const annotation = await getDashboardAnnotation(ctx.dashboardId, annotationId);
    if (!annotation) {
      throw new Error('Annotation not found or access denied');
    }

    await deleteDashboardAnnotation(annotationId);
  },
);
