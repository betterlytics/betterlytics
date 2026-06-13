import { useMemo } from 'react';
import { EVENT_RANGES } from '@/lib/billing/plans';
import type { UsageData } from '@/entities/billing/billing.entities';

export interface UsageProjection {
  suggestedRangeIndex: number;
}

const HOUR_MS = 1_000 * 60 * 60;
export function useUsageProjection(usage?: UsageData): UsageProjection | null {
  return useMemo(() => {
    if (!usage || usage.current <= 0) return null;

    const totalTime = Math.max(HOUR_MS, usage.billingPeriod.end.getTime() - usage.billingPeriod.start.getTime());
    const elapsedTime = Math.max(HOUR_MS, new Date().getTime() - usage.billingPeriod.start.getTime());

    const rawProjected = usage.current * (totalTime / elapsedTime);

    const foundIndex = EVENT_RANGES.findIndex((range) => range.value >= rawProjected);
    const suggestedRangeIndex = foundIndex === -1 ? EVENT_RANGES.length - 1 : foundIndex;

    return { suggestedRangeIndex };
  }, [usage]);
}
