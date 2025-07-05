'use client';

import { useCallback, useEffect } from 'react';
import {
  TimeRangeValue,
  getCompareRangeForTimePresets,
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
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
  onApply: (tempState: TempState) => void;
}

export function useTimeRangeHandlers({
  tempState,
  updateTempState,
  allowedGranularities,
  onApply,
}: UseTimeRangeHandlersProps) {
  const handleQuickSelect = useCallback(
    (value: TimeRangeValue, newGranularity?: GranularityRangeValues) => {
      if (value === 'custom') {
        updateTempState({ range: value, granularity: newGranularity });
        return;
      }
      let { startDate, endDate } = getDateRangeForTimePresets(value);
      let { compareStart, compareEnd } = getCompareRangeForTimePresets(value);

      const granularities = getAllowedGranularities(startDate, endDate);
      const granularity = getValidGranularityFallback(newGranularity || tempState.granularity, granularities);

      if (value === '24h') {
        startDate = getStartDateWithGranularity(startDate, granularity);
        endDate = getEndDateWithGranularity(endDate, granularity);
        compareStart = getStartDateWithGranularity(getDateWithTimeOfDay(compareStart, startDate), granularity);
        compareEnd = getEndDateWithGranularity(getDateWithTimeOfDay(compareEnd, endDate), granularity);
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
    [updateTempState],
  );

  const handleGranularitySelect = useCallback(
    (granularity: GranularityRangeValues) => {
      if (!allowedGranularities.includes(granularity)) return;
      handleQuickSelect(tempState.range, granularity);
    },
    [updateTempState, handleQuickSelect, allowedGranularities],
  );

  const handleStartDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customStart: startOfDay(date),
        customEnd: tempState.customEnd && endOfDay(tempState.customEnd),
      });
    },
    [updateTempState, tempState.customEnd],
  );

  const handleEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customEnd: endOfDay(date),
        customStart: tempState.customStart && startOfDay(tempState.customStart),
      });
    },
    [updateTempState, tempState.customStart],
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

      let compareStart = startOfDay(date);
      let compareEnd = endOfDay(new Date(compareStart.getTime() + timeDifference));

      if (tempState.range === '24h') {
        compareStart = getDateWithTimeOfDay(date, tempState.customStart);
        compareEnd = new Date(compareStart.getTime() + timeDifference);
      }

      updateTempState({
        compareStart,
        compareEnd,
      });
    },
    [updateTempState, tempState],
  );

  const handleCompareEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || !tempState.customStart || !tempState.customEnd) {
        return;
      }

      const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

      let compareEnd = endOfDay(date);
      let compareStart = startOfDay(new Date(compareEnd.getTime() - timeDifference));

      if (tempState.range === '24h') {
        compareEnd = getDateWithTimeOfDay(date, tempState.customEnd);
        compareStart = new Date(compareEnd.getTime() - timeDifference);
      }

      updateTempState({
        compareStart,
        compareEnd,
      });
    },
    [updateTempState, tempState],
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

  useEffect(() => {
    updateTempState({
      granularity: getValidGranularityFallback(tempState.granularity, allowedGranularities),
    });
  }, [tempState.granularity, allowedGranularities, updateTempState]);

  useEffect(() => {
    const customStart =
      tempState.customStart && getStartDateWithGranularity(tempState.customStart, tempState.granularity);
    const customEnd = tempState.customEnd && getEndDateWithGranularity(tempState.customEnd, tempState.granularity);

    const compareStart =
      tempState.compareStart &&
      tempState.customStart &&
      getStartDateWithGranularity(
        getDateWithTimeOfDay(tempState.compareStart, tempState.customStart),
        tempState.granularity,
      );
    const compareEnd =
      tempState.compareEnd &&
      tempState.customEnd &&
      getEndDateWithGranularity(
        getDateWithTimeOfDay(tempState.compareEnd, tempState.customEnd),
        tempState.granularity,
      );

    updateTempState({
      customStart,
      customEnd,
      compareStart,
      compareEnd,
    });
  }, [tempState.granularity, updateTempState]);

  useEffect(() => {
    if (!tempState.compareEnabled || !tempState.customEnd || !tempState.customStart || !tempState.compareStart) {
      return;
    }

    const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

    let compareStart = tempState.compareStart;

    if (tempState.range !== '24h') {
      compareStart = startOfDay(compareStart);
    }

    const compareEnd = new Date(compareStart.getTime() + timeDifference);

    if (
      tempState.compareStart.getTime() !== compareStart.getTime() ||
      tempState.compareEnd?.getTime() !== compareEnd.getTime()
    ) {
      updateTempState({ compareStart, compareEnd });
    }
  }, [tempState, updateTempState]);

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
