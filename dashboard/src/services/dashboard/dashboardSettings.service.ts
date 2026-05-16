'server-only';

import {
  DashboardSettings,
  DashboardSettingsInternalPatch,
  DashboardSettingsUpdate,
  DEFAULT_DASHBOARD_SETTINGS,
  RetentionClampResult,
  RetentionSettingsPatch,
} from '@/entities/dashboard/dashboardSettings.entities';
import * as SettingsRepository from '@/repositories/postgres/dashboardSettings.repository';
import { findDashboardOwner } from '@/repositories/postgres/dashboard.repository';
import { getUserSubscription } from '@/repositories/postgres/subscription.repository';
import { getMaxRetentionDaysForTier } from '@/lib/billing/capabilities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';

export async function getDashboardSettings(dashboardId: string): Promise<DashboardSettings> {
  try {
    const settings = await SettingsRepository.findSettingsByDashboardId(dashboardId);

    if (!settings) {
      return await SettingsRepository.createSettings(dashboardId, DEFAULT_DASHBOARD_SETTINGS);
    }

    return settings;
  } catch (error) {
    console.error('Error getting dashboard settings:', error);
    throw new Error('Failed to get dashboard settings');
  }
}

export async function updateDashboardSettings(
  dashboardId: string,
  updates: DashboardSettingsUpdate,
): Promise<DashboardSettings> {
  try {
    await assertRetentionWithinPlan(dashboardId, updates);

    const patch: DashboardSettingsInternalPatch = { ...updates };
    if (updates.dataRetentionDays !== undefined) {
      patch.retentionGraceUntil = null;
      patch.retentionGraceRestoreDays = null;
    }

    return await SettingsRepository.updateSettings(dashboardId, patch);
  } catch (error) {
    if (error instanceof UserException) {
      throw error;
    }
    console.error('Error updating dashboard settings:', error);
    throw new Error('Failed to update dashboard settings');
  }
}

async function assertRetentionWithinPlan(dashboardId: string, updates: DashboardSettingsUpdate): Promise<void> {
  if (updates.dataRetentionDays === undefined || !isFeatureEnabled('enableBilling')) {
    return;
  }

  const owner = await findDashboardOwner(dashboardId);
  if (!owner) {
    throw new Error(`No owner found for dashboard ${dashboardId} during retention validation`);
  }
  const subscription = await getUserSubscription(owner.userId);
  if (!subscription) {
    throw new Error(`No subscription found for user ${owner.userId} during retention validation`);
  }

  const maxRetentionDays = getMaxRetentionDaysForTier(subscription.tier);
  if (updates.dataRetentionDays > maxRetentionDays) {
    throw new UserException(`Your current plan supports up to ${maxRetentionDays} days of data retention.`);
  }
}

/**
 * Decides per affected DashboardSettings row whether to restore from grace, clamp to the
 * new ceiling, or partially raise retention while the existing grace continues
 */
export async function applyTierChangeToRetention(
  userId: string,
  newMaxDays: number,
  graceUntil: Date,
): Promise<RetentionClampResult> {
  const rows = await SettingsRepository.findOwnerSettingsForRetentionSync(userId, newMaxDays);

  const patches: RetentionSettingsPatch[] = [];
  const clampedFromDays: number[] = [];

  for (const row of rows) {
    const restoreDays = row.retentionGraceRestoreDays;
    const isAboveCeiling = row.dataRetentionDays > newMaxDays;

    if (restoreDays != null && restoreDays <= newMaxDays) {
      patches.push({
        settingsId: row.id,
        dataRetentionDays: restoreDays,
        retentionGraceRestoreDays: null,
        retentionGraceUntil: null,
      });
    } else if (isAboveCeiling) {
      // Clamp: new tier doesn't cover current retention. Preserve the highest-ever
      // restore value across a chain of downgrades and (re-)start the grace clock.
      patches.push({
        settingsId: row.id,
        dataRetentionDays: newMaxDays,
        retentionGraceRestoreDays: Math.max(restoreDays ?? 0, row.dataRetentionDays),
        retentionGraceUntil: graceUntil,
      });
      clampedFromDays.push(row.dataRetentionDays);
    } else if (restoreDays != null) {
      // Partial upgrade mid-grace: raise retention to new tier max but keep the grace
      // open in case the user upgrades further before it expires.
      const raisedDays = Math.max(row.dataRetentionDays, newMaxDays);
      if (raisedDays !== row.dataRetentionDays) {
        patches.push({ settingsId: row.id, dataRetentionDays: raisedDays });
      }
    }
  }

  await SettingsRepository.applyRetentionPatches(patches);

  return clampedFromDays.length > 0
    ? { affectedCount: clampedFromDays.length, previousMaxRetention: Math.max(...clampedFromDays) }
    : { affectedCount: 0, previousMaxRetention: null };
}
