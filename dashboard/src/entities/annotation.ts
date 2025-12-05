import { z } from 'zod';

export const ANNOTATION_LABEL_MAX_LENGTH = 48;
export const ANNOTATION_DESCRIPTION_MAX_LENGTH = 256;

export const AnnotationSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  chartId: z.string(),
  date: z.date(),
  label: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  createdById: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AnnotationCreateSchema = z.object({
  dashboardId: z.string().min(1),
  chartId: z.string().min(1),
  date: z.date(),
  label: z.string().min(1).max(ANNOTATION_LABEL_MAX_LENGTH),
  description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH).nullable(),
  color: z.string().nullable(),
  createdById: z.string().min(1),
});

export const AnnotationUpdateSchema = z.object({
  label: z.string().min(1).max(ANNOTATION_LABEL_MAX_LENGTH).optional(),
  description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH).nullable().optional(),
  color: z.string().nullable().optional(),
});

export type Annotation = z.infer<typeof AnnotationSchema>;
export type AnnotationCreate = z.infer<typeof AnnotationCreateSchema>;
export type AnnotationUpdate = z.infer<typeof AnnotationUpdateSchema>;
