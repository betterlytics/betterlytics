import { randomUUID } from 'node:crypto';
import prisma from '@/lib/postgres';
import {
  TELEMETRY_INSTANCE_ROW_ID,
  TelemetryInstance,
  TelemetryInstanceSchema,
} from '@/entities/system/telemetry.entities';

export async function getOrCreateTelemetryInstance(): Promise<TelemetryInstance> {
  try {
    const row = await prisma.telemetryInstance.upsert({
      where: { id: TELEMETRY_INSTANCE_ROW_ID },
      update: {},
      create: { id: TELEMETRY_INSTANCE_ROW_ID, instanceId: randomUUID() },
    });

    return TelemetryInstanceSchema.parse(row);
  } catch (error) {
    console.error('Error getting or creating telemetry instance:', error);
    throw new Error('Failed to get or create telemetry instance');
  }
}

export async function findTelemetryInstance(): Promise<TelemetryInstance | null> {
  try {
    const row = await prisma.telemetryInstance.findUnique({
      where: { id: TELEMETRY_INSTANCE_ROW_ID },
    });

    return row ? TelemetryInstanceSchema.parse(row) : null;
  } catch (error) {
    console.error('Error finding telemetry instance:', error);
    throw new Error('Failed to find telemetry instance');
  }
}

export async function markTelemetryDelivered(at: Date): Promise<void> {
  try {
    await prisma.telemetryInstance.update({
      where: { id: TELEMETRY_INSTANCE_ROW_ID },
      data: { lastSentAt: at },
    });
  } catch (error) {
    console.error('Error marking telemetry delivered:', error);
    throw new Error('Failed to mark telemetry delivered');
  }
}
