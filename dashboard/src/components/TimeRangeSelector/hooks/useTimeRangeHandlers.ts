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

function getDateRangeWithGranularity(
  range: Exclude<TimeRangeValue, 'custom'>,
  granularity: GranularityRangeValues,
) {
  const preset = getDateRangeForTimePresets(range);

  const customStart = getStartDateWithGranularity(preset.startDate, granularity);
  const customEnd = getEndDateWithGranularity(preset.endDate, granularity);

  return { customStart, customEnd };
}

function getCompareRangeWithGranularity(
  range: TimeRangeValue,
  granularity: GranularityRangeValues,
  startDate: Date,
  endDate: Date,
) {
  if (range === 'custom') {
    return {};
  }

  const preset = getCompareRangeForTimePresets(range);

  const compareStart = getStartDateWithGranularity(
    getDateWithTimeOfDay(preset.compareStart, startDate),
    granularity,
  );
  const compareEnd = getEndDateWithGranularity(getDateWithTimeOfDay(preset.compareEnd, endDate), granularity);

  return { compareStart, compareEnd };
}

function getRangeWithGranularity(range: Exclude<TimeRangeValue, 'custom'>, granularity: GranularityRangeValues) {
  const custom = getDateRangeWithGranularity(range, granularity);
  const compare = getCompareRangeWithGranularity(range, granularity, custom.customStart, custom.customEnd);

  return {
    ...custom,
    ...compare,
  };
}

export function useTimeRangeHandlers({
  tempState,
  updateTempState,
  allowedGranularities,
  onApply,
}: UseTimeRangeHandlersProps) {
  const handleQuickSelect = useCallback(
    (value: TimeRangeValue) => {
      if (value === 'custom') {
        updateTempState({ range: value });
        return;
      }

      const granularityRange = getDateRangeForTimePresets(value);
      const granularity = getValidGranularityFallback(
        tempState.granularity,
        getAllowedGranularities(granularityRange.startDate, granularityRange.endDate),
      );

      const range = getRangeWithGranularity(value, granularity);

      updateTempState({
        range: value,
        granularity,
        ...range,
      });
    },
    [updateTempState, tempState.granularity],
  );

  const handleGranularitySelect = useCallback(
    (granularity: GranularityRangeValues) => {
      if (!allowedGranularities.includes(granularity)) return;

      if (tempState.range === 'custom') {
        updateTempState({ granularity });
        return;
      }

      const range = getDateRangeWithGranularity(tempState.range, granularity);

      updateTempState({
        granularity,
        ...range,
      });
    },
    [updateTempState, allowedGranularities, tempState.range],
  );

  const handleCustomDateRangeSelect = useCallback(
    (from: Date | undefined, to: Date | undefined) => {
      if (!from || !to) {
        return;
      }
      updateTempState({
        range: 'custom',
        customStart: startOfDay(from),
        customEnd: endOfDay(to),
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

  const handleCompareDateRangeSelect = useCallback(
    (from: Date | undefined, to: Date | undefined) => {
      if (!from || !to) {
        return;
      }

      // On end date select
      if (
        tempState.compareEnd &&
        startOfDay(tempState.compareEnd).getTime() !== startOfDay(to).getTime() &&
        tempState.customEnd &&
        tempState.customStart
      ) {
        const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

        const compareEnd = getDateWithTimeOfDay(to, tempState.customEnd);
        const compareStart = new Date(compareEnd.getTime() - timeDifference);
        return updateTempState({
          range: 'custom',
          compareStart,
          compareEnd,
        });
      }

      updateTempState({
        range: 'custom',
        compareStart: startOfDay(from),
        compareEnd: endOfDay(to),
      });
    },
    [updateTempState, tempState],
  );

  const handleCompareStartDateSelect = useCallback(
    (date: Date | undefined) => {
      updateTempState({
        range: 'custom',
        compareStart: date,
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

      const compareEnd = getDateWithTimeOfDay(date, tempState.customEnd);
      const compareStart = new Date(compareEnd.getTime() - timeDifference);

      updateTempState({
        range: 'custom',
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

    const finalState =
      tempState.range === 'custom'
        ? {
            ...tempState,
            granularity: finalGranularity,
            customStart: tempState.customStart && startOfDay(tempState.customStart),
            customEnd: tempState.customEnd && endOfDay(tempState.customEnd),
            compareStart: tempState.compareStart && startOfDay(tempState.compareStart),
            compareEnd: tempState.compareEnd && endOfDay(tempState.compareEnd),
          }
        : {
            ...tempState,
            granulairy: finalGranularity,
            ...getRangeWithGranularity(tempState.range, finalGranularity),
          };

    onApply(finalState);
  }, [tempState, allowedGranularities, onApply]);

  useEffect(() => {
    updateTempState({
      granularity: getValidGranularityFallback(tempState.granularity, allowedGranularities),
    });
  }, [tempState.granularity, allowedGranularities, updateTempState]);

  useEffect(() => {
    if (!tempState.compareEnabled || !tempState.customEnd || !tempState.customStart || !tempState.compareStart) {
      return;
    }

    const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

    const compareStart = getDateWithTimeOfDay(tempState.compareStart, tempState.customStart);
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
    handleCustomDateRangeSelect,
    handleCompareEnabledChange,
    handleCompareDateRangeSelect,
    handleApply,
  };
}
