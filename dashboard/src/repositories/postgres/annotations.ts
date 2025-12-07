import prisma from '@/lib/postgres';
import {
  type Annotation,
  type AnnotationCreate,
  AnnotationCreateSchema,
  AnnotationSchema,
  AnnotationUpdateSchema,
} from '@/entities/annotation';

export async function createAnnotation(data: AnnotationCreate): Promise<Annotation> {
  try {
    const payload = AnnotationCreateSchema.parse(data);

    const annotation = await prisma.annotation.create({
      data: {
        dashboardId: payload.dashboardId,
        chartId: payload.chartId,
        date: payload.date,
        label: payload.label,
        description: payload.description,
        colorToken: payload.colorToken,
        createdById: payload.createdById,
      },
    });

    return AnnotationSchema.parse(annotation);
  } catch (error) {
    console.error('Failed to create annotation', error);
    throw new Error('Unable to create annotation');
  }
}

export async function getAnnotationsByDashboardAndChart(
  dashboardId: string,
  chartId: string,
): Promise<Annotation[]> {
  try {
    const annotations = await prisma.annotation.findMany({
      where: {
        dashboardId,
        chartId,
        deletedAt: null,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return annotations.map((a) => AnnotationSchema.parse(a));
  } catch (error) {
    console.error('Failed to fetch annotations', error);
    throw new Error('Unable to fetch annotations');
  }
}

export async function getAnnotationById(dashboardId: string, id: string): Promise<Annotation | null> {
  try {
    const annotation = await prisma.annotation.findFirst({
      where: { id, dashboardId, deletedAt: null },
    });

    return annotation ? AnnotationSchema.parse(annotation) : null;
  } catch (error) {
    console.error('Failed to fetch annotation', error);
    throw new Error('Unable to fetch annotation');
  }
}

export async function updateAnnotation(
  id: string,
  data: Partial<Pick<Annotation, 'label' | 'description' | 'colorToken' | 'date'>>,
): Promise<Annotation> {
  try {
    const payload = AnnotationUpdateSchema.parse(data);

    const existing = await prisma.annotation.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Annotation not found');
    }

    const annotation = await prisma.annotation.update({ where: { id }, data: payload });

    return AnnotationSchema.parse(annotation);
  } catch (error) {
    console.error('Failed to update annotation', error);
    throw new Error('Unable to update annotation');
  }
}

export async function deleteAnnotation(id: string): Promise<void> {
  try {
    const existing = await prisma.annotation.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new Error('Annotation not found');
    }

    await prisma.annotation.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch (error) {
    console.error('Failed to delete annotation', error);
    throw new Error('Unable to delete annotation');
  }
}
