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
        color: payload.color,
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

export async function getAnnotationById(id: string): Promise<Annotation | null> {
  try {
    const annotation = await prisma.annotation.findUnique({
      where: { id },
    });

    return annotation ? AnnotationSchema.parse(annotation) : null;
  } catch (error) {
    console.error('Failed to fetch annotation', error);
    throw new Error('Unable to fetch annotation');
  }
}

export async function updateAnnotation(
  id: string,
  data: Partial<Pick<Annotation, 'label' | 'description' | 'color'>>,
): Promise<Annotation> {
  try {
    const payload = AnnotationUpdateSchema.parse(data);

    const annotation = await prisma.annotation.update({
      where: { id },
      data: payload,
    });

    return AnnotationSchema.parse(annotation);
  } catch (error) {
    console.error('Failed to update annotation', error);
    throw new Error('Unable to update annotation');
  }
}

export async function deleteAnnotation(id: string): Promise<void> {
  try {
    await prisma.annotation.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to delete annotation', error);
    throw new Error('Unable to delete annotation');
  }
}

export async function deleteAnnotationsByDashboard(dashboardId: string): Promise<void> {
  try {
    await prisma.annotation.deleteMany({
      where: { dashboardId },
    });
  } catch (error) {
    console.error('Failed to delete annotations for dashboard', error);
    throw new Error('Unable to delete annotations for dashboard');
  }
}
