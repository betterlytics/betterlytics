'use client';

import { useCallback } from 'react';
import { TimeRangeValue, getCompareRangeForTimePresets, getDateRangeForTimePresets } from '@/utils/timeRanges';
import { GranularityRangeValues, getValidGranularityFallback } from '@/utils/granularityRanges';

export type TempState = {
  range: TimeRangeValue;
  granularity: GranularityRangeValues;
  customStart: Date | undefined;
  customEnd: Date | undefined;
  compareEnabled: boolean;
  compareStart: Date | undefined;
  compareEnd: Date | undefined;
};

interface UseTimeRangeHandlersProps {
  tempState: TempState;
  updateTempState: (updates: Partial<TempState>) => void;
  allowedGranularities: GranularityRangeValues[];
  periodDurationDays: number | null;
  onApply: (tempState: TempState) => void;
}

export function useTimeRangeHandlers({
  tempState,
  updateTempState,
  allowedGranularities,
  periodDurationDays,
  onApply,
}: UseTimeRangeHandlersProps) {
  const handleQuickSelect = useCallback(
    (value: TimeRangeValue) => {
      if (value === 'custom') {
        updateTempState({ range: value });
        return;
      }

      const { startDate, endDate } = getDateRangeForTimePresets(value);
      const { compareStart, compareEnd } = getCompareRangeForTimePresets(value);

      updateTempState({
        range: value,
        customStart: startDate,
        customEnd: endDate,
        compareStart: compareStart,
        compareEnd: compareEnd,
      });
    },
    [updateTempState, periodDurationDays],
  );

  const handleGranularitySelect = useCallback(
    (granularity: GranularityRangeValues) => {
      if (!allowedGranularities.includes(granularity)) return;
      updateTempState({ granularity });
    },
    [updateTempState, allowedGranularities],
  );

  const handleStartDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customStart: date,
      });
    },
    [updateTempState],
  );

  const handleEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customEnd: date,
      });
    },
    [updateTempState],
  );

  const handleCompareEnabledChange = useCallback(
    (enabled: boolean) => {
      updateTempState({ compareEnabled: enabled });
    },
    [updateTempState],
  );

  const handleCompareStartDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || !periodDurationDays) return;
      // Calculate exact duration in milliseconds to preserve time
      const durationMs = periodDurationDays * 24 * 60 * 60 * 1000;
      const compareEnd = new Date(date.getTime() + durationMs);
      updateTempState({
        compareStart: date,
        compareEnd: compareEnd,
      });
    },
    [updateTempState, periodDurationDays],
  );

  const handleCompareEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || !periodDurationDays) return;

      // Calculate exact duration in milliseconds to preserve time
      const durationMs = periodDurationDays * 24 * 60 * 60 * 1000;
      const compareStart = new Date(date.getTime() - durationMs);
      updateTempState({
        compareStart: compareStart,
        compareEnd: date,
      });
    },
    [updateTempState, periodDurationDays],
  );

  const handleApply = useCallback(() => {
    // Validate granularity before applying
    let finalGranularity = tempState.granularity;
    if (!allowedGranularities.includes(finalGranularity)) {
      finalGranularity = getValidGranularityFallback(finalGranularity, allowedGranularities);
    }

    const finalState = {
      ...tempState,
      granularity: finalGranularity,
    };

    onApply(finalState);
  }, [tempState, allowedGranularities, onApply]);

  return {
    handleQuickSelect,
    handleGranularitySelect,
    handleStartDateSelect,
    handleEndDateSelect,
    handleCompareEnabledChange,
    handleCompareStartDateSelect,
    handleCompareEndDateSelect,
    handleApply,
  };
}
