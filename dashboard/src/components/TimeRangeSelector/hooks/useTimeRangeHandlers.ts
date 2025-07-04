'use client';

import { useCallback } from 'react';
import {
  TimeRangeValue,
  getCompareRangeForTimePresets,
  getDateRangeForTimePresets,
  getDateWithGranularity,
  getDateWithTimeOfDay,
} from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';
import { endOfDay, startOfDay } from 'date-fns';

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

      const granularities = getAllowedGranularities(startDate, endDate);
      const granularity = getValidGranularityFallback(tempState.granularity, granularities);

      if (value === '24h') {
        const granulatedStartDate = getDateWithGranularity(startDate, granularity);
        const granulatedEndDate = getDateWithGranularity(endDate, granularity);

        const granulatedCompareStart = getDateWithGranularity(
          getDateWithTimeOfDay(compareStart, granulatedStartDate),
          granularity,
        );

        const granulatedCompareEnd = getDateWithGranularity(
          getDateWithTimeOfDay(compareEnd, granulatedEndDate),
          granularity,
        );

        return updateTempState({
          range: value,
          granularity,
          customStart: granulatedStartDate,
          customEnd: granulatedEndDate,
          compareStart: granulatedCompareStart,
          compareEnd: granulatedCompareEnd,
        });
      }

      updateTempState({
        range: value,
        granularity,
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
        customStart: startOfDay(date),
      });
    },
    [updateTempState],
  );

  const handleEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customEnd: endOfDay(date),
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
      if (!date || !tempState.customStart || !tempState.customEnd) {
        return;
      }

      const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

      if (tempState.range === '24h') {
        const compareStart = getDateWithTimeOfDay(date, tempState.customStart);
        const compareEnd = new Date(compareStart.getTime() + timeDifference);

        return updateTempState({
          compareStart,
          compareEnd,
        });
      }

      const compareStart = startOfDay(date);
      const compareEnd = endOfDay(new Date(compareStart.getTime() + timeDifference));
      updateTempState({
        compareStart,
        compareEnd,
      });
    },
    [updateTempState, periodDurationDays],
  );

  const handleCompareEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || !tempState.customStart || !tempState.customEnd) {
        return;
      }

      const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

      if (tempState.range === '24h') {
        const compareEnd = getDateWithTimeOfDay(date, tempState.customEnd);
        const compareStart = new Date(compareEnd.getTime() - timeDifference);

        return updateTempState({
          compareStart,
          compareEnd,
        });
      }

      const compareEnd = endOfDay(date);
      const compareStart = startOfDay(new Date(compareEnd.getTime() - timeDifference));
      updateTempState({
        compareStart,
        compareEnd,
      });
    },
    [updateTempState, periodDurationDays],
  );

  const handleApply = useCallback(() => {
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
