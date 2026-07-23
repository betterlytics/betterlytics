import 'server-only';

import { addMonths, startOfDay } from 'date-fns';
import {
  findActiveSubscriptionsWithOwnedSites,
  updateSubscriptionPeriod,
} from '@/repositories/postgres/subscription.repository';
import { getDailyEventCountsForSites } from '@/repositories/clickhouse/usage.repository';
import { type DailySiteUsage, type SubscriptionWithOwnedSites } from '@/entities/billing/billing.entities';
import { toDateString } from '@/utils/dateFormatters';

export type UsageThresholdKind = 'exceeded' | 'approaching';

export function classifyUsageThreshold(pct: number): UsageThresholdKind | null {
  if (!Number.isFinite(pct)) return null;
  if (pct >= 100) return 'exceeded';
  if (pct >= 80) return 'approaching';
  return null;
}

export function formatPlanName(tier: SubscriptionWithOwnedSites['tier']): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function isFreeTierAndExpired(sub: SubscriptionWithOwnedSites): boolean {
  return !sub.paymentSubscriptionId && sub.currentPeriodEnd < new Date();
}

function nextFreeTierPeriod(previousEnd: Date): { currentPeriodStart: Date; currentPeriodEnd: Date } {
  let start = startOfDay(previousEnd);
  let end = addMonths(start, 1);
  const now = new Date();
  while (end < now) {
    start = end;
    end = addMonths(start, 1);
  }
  return { currentPeriodStart: start, currentPeriodEnd: end };
}

async function rollForwardIfStale(sub: SubscriptionWithOwnedSites): Promise<SubscriptionWithOwnedSites> {
  if (!isFreeTierAndExpired(sub)) return sub;
  const next = nextFreeTierPeriod(sub.currentPeriodEnd);
  const rolled = await updateSubscriptionPeriod(sub.userId, next.currentPeriodStart, next.currentPeriodEnd);
  return { ...sub, ...rolled };
}

export async function getScannableSubscriptions(): Promise<SubscriptionWithOwnedSites[]> {
  const raw = await findActiveSubscriptionsWithOwnedSites();
  const withSites = raw.filter((s) => s.siteIds.length > 0);
  const result: SubscriptionWithOwnedSites[] = [];
  for (const sub of withSites) {
    result.push(await rollForwardIfStale(sub));
  }
  return result;
}

export function indexUsageBySite(rows: DailySiteUsage[]): Map<string, DailySiteUsage[]> {
  const out = new Map<string, DailySiteUsage[]>();
  for (const row of rows) {
    const arr = out.get(row.siteId);
    if (arr) arr.push(row);
    else out.set(row.siteId, [row]);
  }
  return out;
}

export function sumUsageForSubscription(
  sub: SubscriptionWithOwnedSites,
  bySite: Map<string, DailySiteUsage[]>,
): number {
  const periodStartMs = startOfDay(sub.currentPeriodStart).getTime();
  let total = 0;
  for (const siteId of sub.siteIds) {
    const rows = bySite.get(siteId);
    if (!rows) continue;
    for (const row of rows) {
      if (new Date(row.date).getTime() >= periodStartMs) total += row.total;
    }
  }
  return total;
}

export async function loadUsageForSubscriptions(
  subs: SubscriptionWithOwnedSites[],
): Promise<Map<string, DailySiteUsage[]>> {
  if (subs.length === 0) return new Map();

  const allSiteIds = [...new Set(subs.flatMap((s) => s.siteIds))];
  const earliestStart = subs.reduce(
    (min, s) => (s.currentPeriodStart < min ? s.currentPeriodStart : min),
    subs[0].currentPeriodStart,
  );

  const rows = await getDailyEventCountsForSites(allSiteIds, toDateString(earliestStart));
  return indexUsageBySite(rows);
}
