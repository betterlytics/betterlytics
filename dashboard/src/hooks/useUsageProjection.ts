import { useMemo } from 'react';
import { VOLUME_STOPS } from '@/lib/billing/catalog';
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

    const foundIndex = VOLUME_STOPS.findIndex((stop) => stop >= rawProjected);
    const suggestedRangeIndex = foundIndex === -1 ? VOLUME_STOPS.length - 1 : foundIndex;

    return { suggestedRangeIndex };
  }, [usage]);
}
