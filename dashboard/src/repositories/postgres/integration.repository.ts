import prisma from '@/lib/postgres';
import type { Prisma } from '@prisma/client';
import {
  Integration,
  IntegrationSchema,
  IntegrationCreate,
  IntegrationCreateSchema,
  IntegrationUpdate,
  IntegrationUpdateSchema,
  IntegrationType,
} from '@/entities/dashboard/integration.entities';

export async function findIntegrationsByDashboardId(dashboardId: string): Promise<Integration[]> {
  try {
    const integrations = await prisma.dashboardIntegration.findMany({
      where: { dashboardId },
      orderBy: { createdAt: 'asc' },
    });

    return integrations.map((i) => IntegrationSchema.parse(i));
  } catch (error) {
    console.error('Error finding integrations by dashboard ID:', error);
    throw new Error('Failed to find integrations');
  }
}

export async function findIntegrationByType(
  dashboardId: string,
  type: IntegrationType,
): Promise<Integration | null> {
  try {
    const integration = await prisma.dashboardIntegration.findUnique({
      where: { dashboardId_type: { dashboardId, type } },
    });

    if (!integration) {
      return null;
    }

    return IntegrationSchema.parse(integration);
  } catch (error) {
    console.error('Error finding integration by type:', error);
    throw new Error('Failed to find integration');
  }
}

export async function createIntegration(data: IntegrationCreate): Promise<Integration> {
  try {
    const validated = IntegrationCreateSchema.parse(data);

    const created = await prisma.dashboardIntegration.create({
      data: {
        ...validated,
        config: validated.config as Prisma.InputJsonValue,
      },
    });

    return IntegrationSchema.parse(created);
  } catch (error) {
    console.error('Error creating integration:', error);
    throw new Error('Failed to create integration');
  }
}

export async function updateIntegration(
  dashboardId: string,
  type: IntegrationType,
  updates: IntegrationUpdate,
): Promise<Integration> {
  try {
    const validatedUpdates = IntegrationUpdateSchema.parse(updates);

    const data: Prisma.DashboardIntegrationUpdateInput = {};
    if (validatedUpdates.name !== undefined) data.name = validatedUpdates.name;
    if (validatedUpdates.enabled !== undefined) data.enabled = validatedUpdates.enabled;
    if (validatedUpdates.config !== undefined) data.config = validatedUpdates.config as Prisma.InputJsonValue;

    const updated = await prisma.dashboardIntegration.update({
      where: { dashboardId_type: { dashboardId, type } },
      data,
    });

    return IntegrationSchema.parse(updated);
  } catch (error) {
    console.error('Error updating integration:', error);
    throw new Error('Failed to update integration');
  }
}

export async function deleteIntegration(dashboardId: string, type: IntegrationType): Promise<void> {
  try {
    await prisma.dashboardIntegration.delete({
      where: { dashboardId_type: { dashboardId, type } },
    });
  } catch (error) {
    console.error('Error deleting integration:', error);
    throw new Error('Failed to delete integration');
  }
}
